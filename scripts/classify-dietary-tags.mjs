#!/usr/bin/env node
// Fills in missing Vegetarian / Lenten (νηστίσιμο) classification for recipes
// that have neither an existing Greek νηστίσιμ* tag nor an English "Vegetarian"
// tag — i.e. recipes with no dietary signal at all yet. Ingredient-based, via
// Claude, additive only (never removes existing tags).
//
// Usage:
//   node scripts/classify-dietary-tags.mjs                 # dry run, first 12
//   node scripts/classify-dietary-tags.mjs --apply          # process + write back ALL gaps
//
// Requires ANTHROPIC_API_KEY in the environment or in .env.local.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RECIPES_PATH = path.join(ROOT, "app", "data", "recipes.json");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local, then re-run.");
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const APPLY = flag("apply");
const CONCURRENCY = Number(opt("concurrency", 5));
const LIMIT = Number(opt("limit", APPLY ? Infinity : 12));
const OUT_PATH = path.join(ROOT, "scripts", "dietary-classification-preview.json");

const client = new Anthropic();

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

const SCHEMA = {
  type: "object",
  properties: {
    isVegetarian: { type: "boolean", description: "No meat, poultry, or fish/seafood. Dairy and eggs are fine." },
    isLenten: { type: "boolean", description: "No meat, poultry, dairy, or eggs. Vegan dishes AND seafood/shellfish dishes both qualify." },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["isVegetarian", "isLenten", "confidence"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You classify Greek recipes by two independent dietary categories, based on the ingredient list.

- isVegetarian: true if there is no meat, poultry, or fish/seafood. Dairy, eggs, and honey are all fine.
- isLenten (νηστίσιμο, Greek Orthodox fasting-appropriate): true if there is no meat, poultry, dairy, or eggs. Vegan dishes qualify. Seafood/shellfish dishes (fish, octopus, squid, shrimp, mussels) also qualify even though they are not vegetarian.

These are independent — a dish can be both, neither, or just one (e.g. a cheese pie is vegetarian but not lenten; a grilled octopus dish is lenten but not vegetarian).

Base your answer only on the ingredients given. Output only the structured fields, no commentary.`;

function buildUserPrompt(recipe) {
  const ingredients = stripHtml(recipe.IngredientsEN || recipe.IngredientsGR);
  const title = recipe.TitleEN || recipe.TitleGR;
  return `Recipe: ${title}\n\nIngredients:\n${ingredients}`;
}

async function classifyOne(recipe) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(recipe) }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error(`No text block for ${recipe.ShortID}`);
  return JSON.parse(textBlock.text);
}

async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runOne));
  return results;
}

function hasExistingSignal(recipe) {
  let tagsGR = [], tagsEN = [];
  try { tagsGR = JSON.parse(recipe.TagsGR || "[]"); } catch {}
  try { tagsEN = JSON.parse(recipe.TagsEN || "[]"); } catch {}
  const hasGrLenten = tagsGR.some((t) => t.toLowerCase().includes("νηστίσιμ"));
  const hasEnVeg = tagsEN.some((t) => t.toLowerCase().trim() === "vegetarian");
  return hasGrLenten || hasEnVeg;
}

async function main() {
  const allRecipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
  const candidates = allRecipes.filter((r) => !hasExistingSignal(r));
  const batch = candidates.slice(0, LIMIT);

  if (batch.length === 0) {
    console.log("Nothing to do — every recipe already has some dietary signal.");
    return;
  }

  console.log(
    `${APPLY ? "APPLY" : "DRY RUN"}: classifying ${batch.length} of ${candidates.length} candidate recipe(s) with no existing signal (out of ${allRecipes.length} total)`
  );

  let done = 0, failed = 0;
  const results = await withConcurrency(batch, CONCURRENCY, async (recipe) => {
    try {
      const fields = await classifyOne(recipe);
      done++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.ShortID, title: recipe.TitleEN || recipe.TitleGR, fields, error: null };
    } catch (err) {
      failed++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.ShortID, title: recipe.TitleEN || recipe.TitleGR, fields: null, error: String(err) };
    }
  });
  console.log("");

  const succeeded = results.filter((r) => r.fields);
  const errored = results.filter((r) => !r.fields);
  const positives = succeeded.filter((r) => r.fields.isVegetarian || r.fields.isLenten);

  if (!APPLY) {
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\nWrote preview for ${results.length} recipe(s) to ${path.relative(ROOT, OUT_PATH)}`);
    console.log(`Succeeded: ${succeeded.length}, failed: ${errored.length}, flagged positive: ${positives.length}`);
    console.log("\nSample positives:");
    for (const r of positives.slice(0, 10)) {
      console.log(`  - ${r.title}: ${JSON.stringify(r.fields)}`);
    }
    console.log("\nReview the full output, then re-run with --apply to write these into recipes.json.");
    return;
  }

  const byId = new Map(succeeded.map((r) => [r.shortId, r.fields]));
  let vegAdded = 0, lentenAdded = 0;
  for (const recipe of allRecipes) {
    const fields = byId.get(recipe.ShortID);
    if (!fields) continue;

    let tagsEN = [], tagsGR = [];
    try { tagsEN = JSON.parse(recipe.TagsEN || "[]"); } catch {}
    try { tagsGR = JSON.parse(recipe.TagsGR || "[]"); } catch {}

    if (fields.isVegetarian && !tagsEN.some((t) => t.toLowerCase().trim() === "vegetarian")) {
      tagsEN.push("Vegetarian");
      vegAdded++;
    }
    if (fields.isLenten) {
      if (!tagsEN.some((t) => t.toLowerCase().includes("lenten"))) tagsEN.push("Lenten");
      if (!tagsGR.some((t) => t.toLowerCase().includes("νηστίσιμ"))) tagsGR.push("Νηστίσιμα");
      lentenAdded++;
    }

    recipe.TagsEN = JSON.stringify(tagsEN);
    recipe.TagsGR = JSON.stringify(tagsGR);
  }

  fs.writeFileSync(RECIPES_PATH, JSON.stringify(allRecipes, null, 2) + "\n");
  console.log(`\nAdded Vegetarian tag to ${vegAdded} recipe(s), Lenten/Νηστίσιμα tag to ${lentenAdded} recipe(s).`);
  if (errored.length) {
    console.log(`${errored.length} recipe(s) failed — re-run to retry them:`);
    for (const r of errored) console.log(`  - ${r.title} (${r.shortId}): ${r.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
