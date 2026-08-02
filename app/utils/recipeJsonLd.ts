import type { Recipe } from "@/types/recipe";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

const BASE_URL = "https://www.grandpatassos.com";

function stripTags(html: string): string[] {
  return html
    .replace(/<\/(p|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toISODuration(minutes?: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
}

function toISODate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return undefined;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export function buildRecipeJsonLd(recipe: Recipe) {
  const url = `${BASE_URL}/recipes/${recipe.ShortID}`;
  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  const datePublished = toISODate(recipe.Date);

  const ingredients = stripTags(recipe.IngredientsEN || recipe.IngredientsGR || "");
  const stepsText = stripTags(recipe.ExecutionEN || recipe.ExecutionGR || "");

  let tags: string[] = [];
  try {
    tags = JSON.parse(recipe.TagsEN || recipe.TagsGR || "[]");
  } catch {
    /* ignore malformed tags */
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.TitleEN || recipe.TitleGR,
    description: recipe.ShortDescriptionEN || recipe.ShortDescriptionGR,
    url,
    ...(datePublished ? { datePublished } : {}),
    ...(recipe.CategoryEN ? { recipeCategory: recipe.CategoryEN } : {}),
    recipeCuisine: "Greek",
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    author: {
      "@type": "Organization",
      name: "Grandpa Tassos Cooking",
      url: BASE_URL,
    },
  };

  // Prefer a real recipe photo over the YouTube thumbnail when one exists —
  // more accurate for Google's recipe rich results than a video thumbnail.
  const gallery = (recipe.GalleryPhotos ?? []).filter((url) => url !== recipe.Image);
  const image = recipe.Image
    ? [recipe.Image, ...gallery]
    : videoID
    ? [`https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`, ...gallery]
    : gallery.length
    ? gallery
    : undefined;
  if (image) jsonLd.image = image;

  const prepTime = toISODuration(recipe.PrepTimeMinutes);
  if (prepTime) jsonLd.prepTime = prepTime;

  const cookTime = toISODuration(recipe.CookTimeMinutes);
  if (cookTime) jsonLd.cookTime = cookTime;

  const totalMinutes = (recipe.PrepTimeMinutes ?? 0) + (recipe.CookTimeMinutes ?? 0);
  const totalTime = toISODuration(totalMinutes);
  if (totalTime) jsonLd.totalTime = totalTime;

  if (recipe.Servings != null) {
    jsonLd.recipeYield = `${recipe.Servings} servings`;
  }

  if (ingredients.length) {
    jsonLd.recipeIngredient = ingredients;
  }

  if (stepsText.length) {
    jsonLd.recipeInstructions = stepsText.map((text) => ({
      "@type": "HowToStep",
      text,
    }));
  }

  if (recipe.CaloriesPerServing != null) {
    jsonLd.nutrition = {
      "@type": "NutritionInformation",
      calories: `${recipe.CaloriesPerServing} calories`,
    };
  }

  if (videoID) {
    jsonLd.video = {
      "@type": "VideoObject",
      name: recipe.TitleEN || recipe.TitleGR,
      description: recipe.ShortDescriptionEN || recipe.ShortDescriptionGR,
      thumbnailUrl: [`https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`],
      ...(datePublished ? { uploadDate: datePublished } : {}),
      contentUrl: `https://www.youtube.com/watch?v=${videoID}`,
      embedUrl: `https://www.youtube.com/embed/${videoID}`,
    };
  }

  return jsonLd;
}
