import type { Recipe } from "@/types/recipe";

export type RecipeRow = {
  short_id: string;
  category_en: string;
  category_gr: string;
  title_en: string;
  title_gr: string;
  short_description_en: string;
  short_description_gr: string;
  long_description_en: string | null;
  long_description_gr: string | null;
  ingredients_en: string;
  ingredients_gr: string;
  execution_en: string | null;
  execution_gr: string | null;
  tags_en: string[];
  tags_gr: string[];
  link_yt: string | null;
  photo_url: string | null;
  gallery_photo_urls: string[];
  recipe_date: string | null; // yyyy-mm-dd from Postgres
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  calories_per_serving: number | null;
  calories_estimated: boolean;
  // Optional here (not on recipeToRow's write payload): admin saves must never
  // touch this column — only the notify-new-recipes cron route sets it.
  notified_at?: string | null;
};

function toDMY(isoDate: string | null): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// Maps a Supabase row back into the existing Recipe shape (PascalCase fields,
// tags as JSON-stringified arrays) so every existing component — RecipeClient,
// RecipeExplorer, search, category pages, matchesCategory, searchRecipes,
// recipeJsonLd — keeps working completely unchanged.
export function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    CategoryGR: row.category_gr,
    CategoryEN: row.category_en,
    Image: row.photo_url ?? undefined,
    GalleryPhotos: row.gallery_photo_urls ?? [],
    TitleGR: row.title_gr,
    TitleEN: row.title_en,
    ShortDescriptionGR: row.short_description_gr,
    ShortDescriptionEN: row.short_description_en,
    IngredientsGR: row.ingredients_gr,
    IngredientsEN: row.ingredients_en,
    LongDescriptionGR: row.long_description_gr ?? undefined,
    LongDescriptionEN: row.long_description_en ?? undefined,
    ExecutionGR: row.execution_gr ?? undefined,
    ExecutionEN: row.execution_en ?? undefined,
    TagsGR: JSON.stringify(row.tags_gr ?? []),
    TagsEN: JSON.stringify(row.tags_en ?? []),
    LinkYT: row.link_yt ?? "",
    ShortID: row.short_id,
    Date: toDMY(row.recipe_date),
    PrepTimeMinutes: row.prep_time_minutes ?? undefined,
    CookTimeMinutes: row.cook_time_minutes ?? undefined,
    Servings: row.servings ?? undefined,
    Difficulty: row.difficulty ?? undefined,
    CaloriesPerServing: row.calories_per_serving ?? undefined,
    CaloriesEstimated: row.calories_estimated,
    NotifiedAt: row.notified_at ?? undefined,
  };
}

// Converts an admin form's Recipe-shaped draft back into DB column shape,
// for insert/update payloads.
export function recipeToRow(recipe: Recipe): Omit<RecipeRow, "short_id"> {
  let tagsEn: string[] = [];
  let tagsGr: string[] = [];
  try { tagsEn = JSON.parse(recipe.TagsEN || "[]"); } catch { /* ignore */ }
  try { tagsGr = JSON.parse(recipe.TagsGR || "[]"); } catch { /* ignore */ }

  const [day, month, year] = (recipe.Date || "").split("/");
  const recipe_date = day && month && year ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : null;

  return {
    category_en: recipe.CategoryEN,
    category_gr: recipe.CategoryGR,
    title_en: recipe.TitleEN,
    title_gr: recipe.TitleGR,
    short_description_en: recipe.ShortDescriptionEN,
    short_description_gr: recipe.ShortDescriptionGR,
    long_description_en: recipe.LongDescriptionEN || null,
    long_description_gr: recipe.LongDescriptionGR || null,
    ingredients_en: recipe.IngredientsEN,
    ingredients_gr: recipe.IngredientsGR,
    execution_en: recipe.ExecutionEN || null,
    execution_gr: recipe.ExecutionGR || null,
    tags_en: tagsEn,
    tags_gr: tagsGr,
    link_yt: recipe.LinkYT || null,
    photo_url: recipe.Image || null,
    gallery_photo_urls: recipe.GalleryPhotos ?? [],
    recipe_date,
    prep_time_minutes: recipe.PrepTimeMinutes ?? null,
    cook_time_minutes: recipe.CookTimeMinutes ?? null,
    servings: recipe.Servings ?? null,
    difficulty: recipe.Difficulty ?? null,
    calories_per_serving: recipe.CaloriesPerServing ?? null,
    calories_estimated: !!recipe.CaloriesEstimated,
  };
}
