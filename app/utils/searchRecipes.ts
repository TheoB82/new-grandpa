import type { Recipe } from "@/types/recipe";
import { parseDate } from "@/utils/parseDate";

function normalize(str: string): string {
  if (!str) return "";
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ς/g, "σ");
}

const GREEK_LATIN: Record<string, string> = {
  α:"a", ά:"a", Α:"a", Ά:"a", β:"v", Β:"v", γ:"g", Γ:"g", δ:"d", Δ:"d",
  ε:"e", έ:"e", Ε:"e", Έ:"e", ζ:"z", Ζ:"z", η:"i", ή:"i", Η:"i", Ή:"i",
  θ:"th", Θ:"th", ι:"i", ί:"i", ϊ:"i", ΐ:"i", Ι:"i", Ί:"i", κ:"k", Κ:"k",
  λ:"l", Λ:"l", μ:"m", Μ:"m", ν:"n", Ν:"n", ξ:"x", Ξ:"x", ο:"o", ό:"o",
  Ο:"o", Ό:"o", π:"p", Π:"p", ρ:"r", Ρ:"r", σ:"s", ς:"s", Σ:"s", τ:"t",
  Τ:"t", υ:"y", ύ:"y", ϋ:"y", ΰ:"y", Υ:"y", Ύ:"y", φ:"f", Φ:"f", χ:"x",
  Χ:"x", ψ:"ps", Ψ:"ps", ω:"o", ώ:"o", Ω:"o", Ώ:"o",
};

function latinize(str: string): string {
  return str.split("").map(ch => GREEK_LATIN[ch] ?? ch).join("").toLowerCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function fuzzyIncludes(text: string, word: string): boolean {
  if (!text || !word) return false;
  const t = normalize(text);
  const w = normalize(word);
  if (t.includes(w)) return true;
  const maxDist = w.length <= 4 ? 1 : 2;
  for (let i = 0; i <= t.length - w.length; i++) {
    let dist = 0;
    for (let j = 0; j < w.length; j++) {
      if (t[i + j] !== w[j]) dist++;
      if (dist > maxDist) break;
    }
    if (dist <= maxDist) return true;
  }
  return false;
}

// Score a single word against one recipe.
// Higher = more relevant. Exact title wins, ingredient match is last resort.
function scoreWord(r: Recipe, word: string): number {
  const w = normalize(word);
  const wLat = w; // user typed Latin already
  const titleEN = normalize(r.TitleEN);
  const titleGR = normalize(r.TitleGR);
  const titleLat = latinize(r.TitleGR);

  if (titleEN === w || titleGR === w || titleLat === wLat) return 100;
  if (titleEN.startsWith(w) || titleGR.startsWith(w) || titleLat.startsWith(wLat)) return 80;
  if (titleLat.includes(wLat)) return 65;
  if (titleEN.includes(w) || titleGR.includes(w)) return 60;
  if (normalize(r.CategoryEN) === w || normalize(r.CategoryGR) === w) return 50;
  if (normalize(r.CategoryEN).includes(w) || normalize(r.CategoryGR).includes(w)) return 40;
  if (fuzzyIncludes(String(r.TagsEN), word) || fuzzyIncludes(String(r.TagsGR), word)) return 30;
  if (fuzzyIncludes(r.ShortDescriptionEN, word) || fuzzyIncludes(r.ShortDescriptionGR, word)) return 20;
  if (
    fuzzyIncludes(stripHtml(r.IngredientsEN || ""), word) ||
    fuzzyIncludes(stripHtml(r.IngredientsGR || ""), word)
  ) return 10;
  if (fuzzyIncludes(r.TitleEN, word) || fuzzyIncludes(r.TitleGR, word)) return 5;
  return 0;
}

function scoreRecipe(r: Recipe, words: string[]): number {
  return words.reduce((sum, w) => sum + scoreWord(r, w), 0);
}

export function wordMatchesRecipe(r: Recipe, word: string): boolean {
  return scoreWord(r, word) > 0;
}

/** Search + relevance-sort recipes by a free-text query. Empty query returns all, date-sorted. */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const words = query.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return recipes.slice().sort((a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime());
  }

  const matches = recipes.filter((r) => words.every((word) => wordMatchesRecipe(r, word)));

  return matches
    .map((r) => ({ r, score: scoreRecipe(r, words) }))
    .sort((a, b) => b.score - a.score || parseDate(b.r.Date).getTime() - parseDate(a.r.Date).getTime())
    .map((s) => s.r);
}
