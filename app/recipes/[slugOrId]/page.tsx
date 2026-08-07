import type { Metadata } from "next";
import { getAllRecipes, getRecipeByShortId } from "@/utils/recipesData";
import slugify from "@/utils/slugify";
import RecipeClient from "./recipe-client";
import { notFound, redirect } from "next/navigation";
import { Recipe } from "@/types/recipe";
import { buildRecipeJsonLd } from "@/utils/recipeJsonLd";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slugOrId: string }>;
}

async function findRecipe(slugOrId: string): Promise<Recipe | undefined> {
  // Try short ID first (single-row query, cheaper on cache miss)
  const byId = await getRecipeByShortId(slugOrId);
  if (byId) return byId;
  // Fall back to slug scan against the cached list
  const recipes = await getAllRecipes();
  return recipes.find((r) => slugify(r.TitleEN || "") === slugify(slugOrId));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slugOrId } = await params;
  const recipe = await findRecipe(slugOrId);
  if (!recipe) return {};

  const desc = recipe.ShortDescriptionEN ?? "";

  // Keep <title> under 60 chars for Google — branding goes in og:site_name
  const pageTitle = recipe.TitleEN.length <= 57
    ? `${recipe.TitleEN} | GTC`
    : recipe.TitleEN.slice(0, 57) + "…";

  return {
    title: pageTitle,
    description: desc,
    openGraph: {
      title: recipe.TitleEN,
      description: desc,
      siteName: "Grandpa Tassos Cooking",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.TitleEN,
      description: desc,
    },
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { slugOrId } = await params;

  if (!slugOrId) return notFound();

  // 1️⃣ Try SHORT ID (canonical) — single-row query, much cheaper than full list
  const recipe = await getRecipeByShortId(slugOrId);

  if (recipe) {
    // getAllRecipes() is cache-shared with any other concurrent renders this hour
    const recipes = await getAllRecipes();
    const jsonLd = buildRecipeJsonLd(recipe);
    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <RecipeClient recipe={recipe} recipes={recipes} />
      </>
    );
  }

  // 2️⃣ Try SLUG -> redirect to ShortID
  const recipes = await getAllRecipes();
  const bySlug = recipes.find(
    (r) => slugify(r.TitleEN || "") === slugify(slugOrId)
  );

  if (!bySlug) return notFound();

  return redirect(`/recipes/${bySlug.ShortID}`);
}
