import type { Metadata } from "next";
import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import RecipeClient from "./recipe-client";
import { notFound, redirect } from "next/navigation";
import { Recipe } from "@/types/recipe";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

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

  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  const image   = videoID
    ? `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`
    : undefined;

  const title = `${recipe.TitleEN} | Grandpa Tassos Cooking`;
  const desc  = recipe.ShortDescriptionEN ?? "";

  return {
    title,
    description: desc,
    openGraph: {
      title: recipe.TitleEN,
      description: desc,
      type: "article",
      ...(image && {
        images: [{ url: image, width: 1280, height: 720, alt: recipe.TitleEN }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.TitleEN,
      description: recipe.ShortDescriptionEN ?? "",
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
