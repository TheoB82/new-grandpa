#!/usr/bin/env node
// One-time backfill: classifies each recipe's season(s) — spring/summer/autumn/winter —
// for the weekly meal planner's seasonal filtering. Operates on the live Supabase
// `recipes` table (not recipes.json, which is an inert post-migration fallback).
// Additive/idempotent: only fills recipes with an empty `seasons` array; never
// overwrites an existing classification (including manual admin overrides).
//
// Usage:
//   node scripts/classify-seasons.mjs                 # dry run, first 12
//   node scripts/classify-seasons.mjs --limit 30       # dry run, first 30
//   node scripts/classify-seasons.mjs --apply          # process + write back ALL empty ones
//
// Requires ANTHROPIC_API_KEY and NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const client = new Anthropic();

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const APPLY = flag("apply");
const CONCURRENCY = Number(opt("concurrency", 5));
const LIMIT = Number(opt("limit", APPLY ? Infinity : 12));

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
    seasons: {
      type: "array",
      items: { type: "string", enum: ["spring", "summer", "autumn", "winter"] },
      description: "Season(s) this dish is genuinely associated with. Empty array if it's an any-season dish with no strong seasonal identity.",
    },
  },
  required: ["seasons"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You classify a Greek recipe by which season(s) it's genuinely associated with, for a "what should I cook this week" seasonal meal planner.

Rules:
- Base this on the ingredients (e.g. watermelon/tomatoes/courgettes → summer; pumpkin/mushrooms → autumn; hearty stews/legume soups → autumn/winter; fresh spring greens/artichokes → spring) and on the dish type (e.g. a cold salad skews warm-weather, a baked casserole skews cold-weather).
- A dish can belong to multiple seasons, or none. Return an EMPTY array if it's a genuinely any-season dish (e.g. most breads, many desserts, everyday staples like plain rice or grilled chicken) — do not force a guess. Being conservative and returning empty is correct and expected for a large share of recipes.
- Output only the structured field, no commentary.`;

function buildUserPrompt(recipe) {
  const ingredients = stripHtml(recipe.ingredients_en || recipe.ingredients_gr);
  const title = recipe.title_en || recipe.title_gr;
  return `Recipe: ${title}\nCategory: ${recipe.category_en}\n\nIngredients:\n${ingredients}`;
}

async function classifyOne(recipe) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(recipe) }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error(`No text block for ${recipe.short_id}`);
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

async function main() {
  const { data: allRecipes, error } = await supabase
    .from("recipes")
    .select("short_id, title_en, title_gr, category_en, ingredients_en, ingredients_gr, seasons");
  if (error) throw error;

  const candidates = allRecipes.filter((r) => !r.seasons || r.seasons.length === 0);
  const batch = candidates.slice(0, LIMIT);

  if (batch.length === 0) {
    console.log("Nothing to do — every recipe already has a season classification (or an intentional empty one from a prior run).");
    return;
  }

  console.log(
    `${APPLY ? "APPLY" : "DRY RUN"}: classifying ${batch.length} of ${candidates.length} unclassified recipe(s) (out of ${allRecipes.length} total), concurrency=${CONCURRENCY}`
  );

  let done = 0, failed = 0;
  const results = await withConcurrency(batch, CONCURRENCY, async (recipe) => {
    try {
      const fields = await classifyOne(recipe);
      done++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.short_id, title: recipe.title_en || recipe.title_gr, seasons: fields.seasons, error: null };
    } catch (err) {
      failed++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.short_id, title: recipe.title_en || recipe.title_gr, seasons: null, error: String(err) };
    }
  });
  console.log("");

  const succeeded = results.filter((r) => r.seasons !== null);
  const errored = results.filter((r) => r.seasons === null);
  const withSeasons = succeeded.filter((r) => r.seasons.length > 0);

  console.log(`\nSucceeded: ${succeeded.length}, failed: ${errored.length}, given a real season (not left any-season): ${withSeasons.length}`);
  console.log("\nSample:");
  for (const r of succeeded.slice(0, 10)) {
    console.log(`  - ${r.title}: [${r.seasons.join(", ") || "any"}]`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these into Supabase.");
    return;
  }

  for (const r of succeeded) {
    const { error: updateError } = await supabase.from("recipes").update({ seasons: r.seasons }).eq("short_id", r.shortId);
    if (updateError) console.error(`  failed to write ${r.shortId}: ${updateError.message}`);
  }

  console.log(`\nWrote season classification for ${succeeded.length} recipe(s).`);
  if (errored.length) {
    console.log(`${errored.length} recipe(s) failed to classify — re-run to retry them:`);
    for (const r of errored) console.log(`  - ${r.title} (${r.shortId}): ${r.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
