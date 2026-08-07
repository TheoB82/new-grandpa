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

// unstable_cache persists across serverless function invocations for 1 hour.
// This is the primary guard against Supabase egress: with ~400 recipes and
// large HTML fields per row, a per-request SELECT * was generating massive egress.
// revalidateTag("recipes") in the admin API clears this cache on every recipe save.
export const getAllRecipes = cache(
  unstable_cache(
    async (): Promise<Recipe[]> => {
      const { data, error } = await supabase.from("recipes").select("*");
      if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);
      return (data as RecipeRow[]).map(mapRecipeRow);
    },
    ["all-recipes"],
    { revalidate: 3600, tags: ["recipes"] }
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
    { revalidate: 3600, tags: ["recipes"] }
  )
);
