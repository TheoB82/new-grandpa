import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import RecipeClient from "./recipe-client";
import { notFound, redirect } from "next/navigation";
import { Recipe } from "@/types/recipe";

interface PageProps {
  params: Promise<{ slugOrId: string }>;
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

  // Redirect slug → ShortID
  return redirect(`/recipes/${recipe.ShortID}`);
}
