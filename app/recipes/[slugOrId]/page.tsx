import type { Metadata } from "next";
import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import RecipeClient from "./recipe-client";
import { notFound, redirect } from "next/navigation";
import { Recipe } from "@/types/recipe";
import { buildRecipeJsonLd } from "@/utils/recipeJsonLd";

interface PageProps {
  params: Promise<{ slugOrId: string }>;
}

function findRecipe(slugOrId: string): Recipe | undefined {
  return (
    (recipes as Recipe[]).find((r) => r.ShortID === slugOrId) ??
    (recipes as Recipe[]).find((r) => slugify(r.TitleEN || "") === slugify(slugOrId))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slugOrId } = await params;
  const recipe = findRecipe(slugOrId);
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

  // 1️⃣ Try SHORT ID (canonical)
  let recipe: Recipe | undefined = (recipes as Recipe[]).find(
    (r) => r.ShortID === slugOrId
  );

  if (recipe) {
    const jsonLd = buildRecipeJsonLd(recipe);
    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <RecipeClient recipe={recipe} />
      </>
    );
  }

  // 2️⃣ Try SLUG -> redirect to ShortID
  recipe = (recipes as Recipe[]).find(
    (r) => slugify(r.TitleEN || "") === slugify(slugOrId)
  );

  if (!recipe) return notFound();

  return redirect(`/recipes/${recipe.ShortID}`);
}
