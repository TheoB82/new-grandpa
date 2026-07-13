import type { Metadata } from "next";
import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import RecipeClient from "./recipe-client";
import { notFound, redirect } from "next/navigation";
import { Recipe } from "@/types/recipe";

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

  // Use the generated OG image route (1200×630, correct aspect ratio + branded)
  const image = `/recipes/${recipe.ShortID}/opengraph-image`;

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
      ...(image && {
        images: [{ url: image, width: 1280, height: 720, alt: recipe.TitleEN }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.TitleEN,
      description: desc,
      ...(image && { images: [image] }),
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
    return <RecipeClient recipe={recipe} />;
  }

  // 2️⃣ Try SLUG -> redirect to ShortID
  recipe = (recipes as Recipe[]).find(
    (r) => slugify(r.TitleEN || "") === slugify(slugOrId)
  );

  if (!recipe) return notFound();

  return redirect(`/recipes/${recipe.ShortID}`);
}
