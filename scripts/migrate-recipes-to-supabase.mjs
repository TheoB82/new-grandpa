#!/usr/bin/env node
// One-time migration: app/data/recipes.json -> Supabase `recipes` table.
// Safe to re-run — upserts on short_id conflict.
//
// Usage:
//   node scripts/migrate-recipes-to-supabase.mjs           # dry run, prints the first 3 transformed rows
//   node scripts/migrate-recipes-to-supabase.mjs --apply    # actually upsert all 409 rows
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local
// (the secret key is required — RLS blocks writes from the anon/publishable key).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const APPLY = process.argv.includes("--apply");

function parseTags(json) {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toISODate(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function transform(r) {
  return {
    short_id: r.ShortID,
    category_en: r.CategoryEN,
    category_gr: r.CategoryGR,
    title_en: r.TitleEN,
    title_gr: r.TitleGR,
    short_description_en: r.ShortDescriptionEN,
    short_description_gr: r.ShortDescriptionGR,
    long_description_en: r.LongDescriptionEN || null,
    long_description_gr: r.LongDescriptionGR || null,
    ingredients_en: r.IngredientsEN,
    ingredients_gr: r.IngredientsGR,
    execution_en: r.ExecutionEN || null,
    execution_gr: r.ExecutionGR || null,
    tags_en: parseTags(r.TagsEN),
    tags_gr: parseTags(r.TagsGR),
    link_yt: r.LinkYT || null,
    photo_url: null,
    recipe_date: toISODate(r.Date),
    prep_time_minutes: r.PrepTimeMinutes ?? null,
    cook_time_minutes: r.CookTimeMinutes ?? null,
    servings: r.Servings ?? null,
    difficulty: r.Difficulty ?? null,
    calories_per_serving: r.CaloriesPerServing ?? null,
    calories_estimated: !!r.CaloriesEstimated,
  };
}

async function main() {
  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
  const rows = recipes.map(transform);

  if (!APPLY) {
    console.log(`DRY RUN — ${rows.length} recipes would be upserted. First 3 transformed rows:\n`);
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    console.log("\nRe-run with --apply to actually write to Supabase.");
    return;
  }

  console.log(`Upserting ${rows.length} recipes...`);

  // Batch in chunks of 100 to stay well under any request size limits.
  const CHUNK = 100;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("recipes").upsert(chunk, { onConflict: "short_id" });
    if (error) {
      console.error(`\nFailed on chunk starting at row ${i}:`, error.message);
      process.exit(1);
    }
    written += chunk.length;
    process.stdout.write(`\r  ${written}/${rows.length}`);
  }
  console.log("\nDone.");

  const { count, error: countError } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true });
  if (countError) {
    console.error("Could not verify row count:", countError.message);
  } else {
    console.log(`Verified: ${count} rows in Supabase (source had ${rows.length}).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
