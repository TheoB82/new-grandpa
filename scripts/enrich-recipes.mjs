#!/usr/bin/env node
// One-time backfill: prep/cook time, servings, difficulty, and estimated calories
// for recipes in app/data/recipes.json, using Claude to extract from the existing
// ingredients + execution text (most recipes already state timing in the steps).
//
// Usage:
//   node scripts/enrich-recipes.mjs                 # dry run, first 12 recipes
//   node scripts/enrich-recipes.mjs --limit 30       # dry run, first 30
//   node scripts/enrich-recipes.mjs --apply          # process + write back ALL missing recipes
//   node scripts/enrich-recipes.mjs --apply --force  # re-process even recipes that already have fields
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
  console.error(
    "ANTHROPIC_API_KEY is not set. Add it to .env.local (ANTHROPIC_API_KEY=sk-ant-...) or export it in your shell, then re-run."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const APPLY = flag("apply");
const FORCE = flag("force");
const NO_TRANSCRIPTS = flag("no-transcripts");
const CONCURRENCY = Number(opt("concurrency", 5));
const START = Number(opt("start", 0));
const LIMIT = Number(opt("limit", APPLY ? Infinity : 12));
const OUT_PATH = path.join(ROOT, "scripts", "enrichment-preview.json");
const TRANSCRIPT_CACHE_PATH = path.join(ROOT, "scripts", ".transcript-cache.json");

const client = new Anthropic();

// ---- YouTube transcript fetching ----

function loadTranscriptCache() {
  if (!fs.existsSync(TRANSCRIPT_CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(TRANSCRIPT_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}
const transcriptCache = loadTranscriptCache();
let transcriptCacheDirty = false;

function saveTranscriptCache() {
  if (!transcriptCacheDirty) return;
  fs.writeFileSync(TRANSCRIPT_CACHE_PATH, JSON.stringify(transcriptCache, null, 2));
  transcriptCacheDirty = false;
}

function getYoutubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

// All YouTube requests (not the Claude calls) are serialized through this gate with a
// minimum gap and 429 backoff — hitting the timedtext endpoint too fast gets rate-limited
// almost immediately (observed HTTP 429 after a handful of rapid requests in testing).
let lastYoutubeFetch = 0;
const MIN_GAP_MS = Number(process.env.YT_FETCH_GAP_MS || 1800);

// Circuit breaker: if the timedtext endpoint is being rate-limited hard (as observed —
// 429s that don't clear even after backoff), stop hitting it entirely after a few
// consecutive failures rather than burning ~1min/video in backoff across 409 videos.
let consecutive429s = 0;
let transcriptCircuitOpen = false;
const CIRCUIT_BREAKER_THRESHOLD = 3;

async function rateLimitedFetch(url, options, retriesLeft = 1) {
  const wait = Math.max(0, lastYoutubeFetch + MIN_GAP_MS - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastYoutubeFetch = Date.now();
  const res = await fetch(url, options);
  if (res.status === 429 && retriesLeft > 0) {
    if (process.env.DEBUG_TRANSCRIPTS) console.error(`\n[transcript debug] 429 — backing off 8000ms`);
    await res.text().catch(() => {}); // drain body
    await new Promise((r) => setTimeout(r, 8000));
    return rateLimitedFetch(url, options, retriesLeft - 1);
  }
  return res;
}

async function fetchCaptionTracks(videoId) {
  const res = await rateLimitedFetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "CONSENT=YES+42",
    },
  });
  if (!res.ok) throw new Error(`watch page HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/"captionTracks":(\[.*?\])(?:,"audioTracks"|,"translationLanguages"|\})/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

async function fetchTranscriptText(videoId) {
  if (transcriptCache[videoId] !== undefined) return transcriptCache[videoId];
  if (transcriptCircuitOpen) return null;

  let text = null;
  let hitRateLimit = false;
  try {
    const tracks = await fetchCaptionTracks(videoId);
    // Prefer Greek (manual over auto-generated), then any manual track, then anything available.
    const pick =
      tracks.find((t) => t.languageCode === "el" && t.kind !== "asr") ||
      tracks.find((t) => t.languageCode === "el") ||
      tracks.find((t) => t.kind !== "asr") ||
      tracks[0];

    if (pick) {
      const xmlRes = await rateLimitedFetch(pick.baseUrl);
      if (xmlRes.status === 429) hitRateLimit = true;
      if (!xmlRes.ok) throw new Error(`timedtext HTTP ${xmlRes.status}`);
      const xml = await xmlRes.text();
      const lines = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) =>
        decodeHtmlEntities(m[1]).trim()
      );
      text = lines.join(" ").replace(/\s+/g, " ").trim() || null;
    }
  } catch (e) {
    if (process.env.DEBUG_TRANSCRIPTS) console.error(`\n[transcript debug] ${videoId}:`, e);
    text = null;
  }

  if (hitRateLimit) {
    consecutive429s++;
    if (consecutive429s >= CIRCUIT_BREAKER_THRESHOLD && !transcriptCircuitOpen) {
      transcriptCircuitOpen = true;
      console.error(
        `\n[transcripts] Hit ${CIRCUIT_BREAKER_THRESHOLD} consecutive rate limits from YouTube — disabling transcript fetching for the rest of this run (falling back to ingredients/steps text only).`
      );
    }
  } else if (text) {
    consecutive429s = 0;
  }

  transcriptCache[videoId] = text;
  transcriptCacheDirty = true;
  return text;
}

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
    prepTimeMinutes: { type: ["integer", "null"], description: "Active prep time before cooking starts, in minutes" },
    cookTimeMinutes: { type: ["integer", "null"], description: "Cooking/baking time, in minutes" },
    servings: { type: ["integer", "null"], description: "Number of servings/portions this recipe yields" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    caloriesPerServing: { type: ["integer", "null"], description: "Rough estimated calories per serving, based on the ingredient quantities" },
    confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident you are in these numbers given the source text" },
  },
  required: ["prepTimeMinutes", "cookTimeMinutes", "servings", "difficulty", "caloriesPerServing", "confidence"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You extract structured recipe metadata (prep time, cook time, servings, difficulty, estimated calories) from Greek recipe text and, when available, a transcript of the cooking video.

Rules:
- The video transcript, when present, is the most reliable source for actual times spoken aloud while cooking (e.g. "now let it bake for 45 minutes") — prefer it over the written steps when they conflict.
- Otherwise prefer times explicitly stated in the written steps over guessing.
- If prep time isn't stated anywhere, estimate it reasonably from the number and complexity of steps before cooking starts.
- Servings: infer from pan/dish size, ingredient quantities, or explicit mentions. If truly unknowable, use a reasonable default for a home-style dish (4-6).
- Difficulty: Easy (few steps, forgiving), Medium (multiple components or techniques), Hard (dough/pastry work, precise timing, many components).
- caloriesPerServing: estimate from the ingredient list and quantities using general nutrition knowledge. This is always an estimate, not a lab measurement.
- confidence: "high" if times/servings were explicitly stated (written steps or transcript), "medium" if reasonably inferable, "low" if mostly guessed.
- Output only the structured fields. No commentary.`;

const MAX_TRANSCRIPT_CHARS = 8000;

async function buildUserPrompt(recipe) {
  const ingredients = stripHtml(recipe.IngredientsEN || recipe.IngredientsGR);
  const execution = stripHtml(recipe.ExecutionEN || recipe.ExecutionGR);
  const title = recipe.TitleEN || recipe.TitleGR;

  let transcriptSection = "";
  if (!NO_TRANSCRIPTS) {
    const videoId = getYoutubeVideoId(recipe.LinkYT);
    const transcript = videoId ? await fetchTranscriptText(videoId) : null;
    if (transcript) {
      const truncated = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
      transcriptSection = `\n\nVideo transcript (may be Greek, auto-generated, and imperfect):\n${truncated}`;
    }
  }

  return `Recipe: ${title}\n\nIngredients:\n${ingredients}\n\nSteps:\n${execution}${transcriptSection}`;
}

async function enrichOne(recipe) {
  const userPrompt = await buildUserPrompt(recipe);
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error(`No text block in response for ${recipe.ShortID}`);
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

function needsEnrichment(recipe) {
  if (FORCE) return true;
  return (
    recipe.PrepTimeMinutes === undefined ||
    recipe.CookTimeMinutes === undefined ||
    recipe.Servings === undefined ||
    recipe.Difficulty === undefined ||
    recipe.CaloriesPerServing === undefined
  );
}

async function main() {
  const allRecipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
  const candidates = allRecipes.filter(needsEnrichment).slice(START);
  const batch = candidates.slice(0, LIMIT);

  if (batch.length === 0) {
    console.log("Nothing to do — no recipes need enrichment (use --force to re-process).");
    return;
  }

  console.log(
    `${APPLY ? "APPLY" : "DRY RUN"}: enriching ${batch.length} of ${candidates.length} candidate recipe(s) (out of ${allRecipes.length} total), concurrency=${CONCURRENCY}`
  );

  let done = 0;
  let failed = 0;
  const results = await withConcurrency(batch, CONCURRENCY, async (recipe) => {
    try {
      const fields = await enrichOne(recipe);
      done++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.ShortID, title: recipe.TitleEN || recipe.TitleGR, fields, error: null };
    } catch (err) {
      failed++;
      process.stdout.write(`\r  processed ${done}/${batch.length} (${failed} failed)`);
      return { shortId: recipe.ShortID, title: recipe.TitleEN || recipe.TitleGR, fields: null, error: String(err) };
    } finally {
      saveTranscriptCache();
    }
  });
  console.log("");

  if (!NO_TRANSCRIPTS) {
    const withTranscript = batch.filter((r) => {
      const id = getYoutubeVideoId(r.LinkYT);
      return id && transcriptCache[id];
    }).length;
    console.log(`Transcripts found: ${withTranscript}/${batch.length}`);
  }

  const succeeded = results.filter((r) => r.fields);
  const errored = results.filter((r) => !r.fields);

  if (!APPLY) {
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\nWrote preview for ${results.length} recipe(s) to ${path.relative(ROOT, OUT_PATH)}`);
    console.log(`Succeeded: ${succeeded.length}, failed: ${errored.length}`);
    console.log("\nSample:");
    for (const r of succeeded.slice(0, 5)) {
      console.log(`  - ${r.title}: ${JSON.stringify(r.fields)}`);
    }
    if (errored.length) {
      console.log("\nErrors:");
      for (const r of errored) console.log(`  - ${r.title} (${r.shortId}): ${r.error}`);
    }
    console.log("\nReview the full output, then re-run with --apply to write these into recipes.json.");
    return;
  }

  // Apply mode: merge results back into recipes.json by ShortID
  const byId = new Map(succeeded.map((r) => [r.shortId, r.fields]));
  let updated = 0;
  for (const recipe of allRecipes) {
    const fields = byId.get(recipe.ShortID);
    if (!fields) continue;
    recipe.PrepTimeMinutes = fields.prepTimeMinutes ?? undefined;
    recipe.CookTimeMinutes = fields.cookTimeMinutes ?? undefined;
    recipe.Servings = fields.servings ?? undefined;
    recipe.Difficulty = fields.difficulty ?? undefined;
    recipe.CaloriesPerServing = fields.caloriesPerServing ?? undefined;
    recipe.CaloriesEstimated = true;
    updated++;
  }

  fs.writeFileSync(RECIPES_PATH, JSON.stringify(allRecipes, null, 2) + "\n");
  console.log(`\nUpdated ${updated} recipe(s) in ${path.relative(ROOT, RECIPES_PATH)}.`);
  if (errored.length) {
    console.log(`${errored.length} recipe(s) failed and were left unchanged — re-run to retry them:`);
    for (const r of errored) console.log(`  - ${r.title} (${r.shortId}): ${r.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
