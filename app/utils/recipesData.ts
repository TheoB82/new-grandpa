import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Recipe } from "@/types/recipe";
import { mapRecipeRow, type RecipeRow } from "@/utils/mapRecipeRow";

// Anon-key client is fine here — reads are public (RLS: SELECT allowed for everyone).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// React's cache() dedupes this across generateMetadata + the page body within
// a single request — both call getAllRecipes(), but only one fetch happens.
export const getAllRecipes = cache(async (): Promise<Recipe[]> => {
  const { data, error } = await supabase.from("recipes").select("*");
  if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);
  return (data as RecipeRow[]).map(mapRecipeRow);
});
