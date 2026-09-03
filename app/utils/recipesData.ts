import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Recipe } from "@/types/recipe";
import { mapRecipeRow, type RecipeRow } from "@/utils/mapRecipeRow";

// Anon-key client is fine here — reads are public (RLS: SELECT allowed for everyone).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Columns fetched for listing, search, cards, similar-recipe suggestions, meal
// planner, and sitemap. The six large HTML content columns — ingredients_en/gr,
// execution_en/gr, long_description_en/gr — are intentionally excluded: no
// getAllRecipes() caller renders them. They are fetched only via getRecipeByShortId
// (the individual recipe detail page). Dropping them cuts payload by ~80–90%.
const SUMMARY_COLUMNS = [
  "short_id", "category_en", "category_gr",
  "title_en", "title_gr",
  "short_description_en", "short_description_gr",
  "photo_url", "gallery_photo_urls",
  "recipe_date", "link_yt",
  "tags_en", "tags_gr",
  "prep_time_minutes", "cook_time_minutes",
  "servings", "difficulty",
  "calories_per_serving", "calories_estimated",
  "seasons", "notified_at",
].join(", ");

// unstable_cache persists across serverless function invocations for 1 hour.
// revalidateTag("recipes") in the admin API clears this cache on every recipe save.
export const getAllRecipes = cache(
  unstable_cache(
    async (): Promise<Recipe[]> => {
      const { data, error } = await supabase.from("recipes").select(SUMMARY_COLUMNS);
      if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);
      return (data as unknown as RecipeRow[]).map(mapRecipeRow);
    },
    ["all-recipes"],
    { revalidate: false, tags: ["recipes"] }
  )
);

// Single-recipe fetch for detail pages — avoids pulling all 400 recipes when
// only one is needed (e.g., on a cache miss after revalidation).
export const getRecipeByShortId = cache(
  unstable_cache(
    async (shortId: string): Promise<Recipe | null> => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("short_id", shortId)
        .single();
      if (error || !data) return null;
      return mapRecipeRow(data as RecipeRow);
    },
    ["recipe-by-short-id"],
    { revalidate: false, tags: ["recipes"] }
  )
);
