import recipes from "@/data/recipes.json";
import slugify from "./slugify";
import type { Recipe } from "@/types/recipe";

export function getRecipeBySlug(slug: string): Recipe | null {
  const list = recipes as Recipe[];

  return (
    list.find((r) => slugify(r.TitleGR) === slug) ||
    list.find((r) => slugify(r.TitleEN) === slug) ||
    null
  );
}
