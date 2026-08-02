import type { Recipe } from "@/types/recipe";
import type { CategoryItem } from "@/utils/categoryMapping";

function parseTags(json: string | undefined): string[] {
  try {
    return JSON.parse(json || "[]");
  } catch {
    return [];
  }
}

// Greek variants (e.g. "νηστίσιμ") are safe to substring-match — no other word
// in this dataset shares that root. Short English variants ("lent", "fasting")
// need exact matching, or "lent" would also match an ingredient tag like "Lentils".
function tagMatchesVariant(tag: string, variant: string): boolean {
  const t = tag.toLowerCase().trim();
  const v = variant.toLowerCase();
  if (/[Ͱ-Ͽ]/.test(v)) return t.includes(v);
  return t === v;
}

export function matchesCategory(recipe: Recipe, cat: CategoryItem, lang: "gr" | "en"): boolean {
  const primaryCategory = lang === "gr" ? recipe.CategoryGR : recipe.CategoryEN;
  const catName = lang === "gr" ? cat.gr : cat.en;
  if (primaryCategory === catName) return true;

  if (!cat.tagVariants || cat.tagVariants.length === 0) return false;

  const allTags = [...parseTags(recipe.TagsGR), ...parseTags(recipe.TagsEN)];
  return cat.tagVariants.some((variant) => allTags.some((tag) => tagMatchesVariant(tag, variant)));
}
