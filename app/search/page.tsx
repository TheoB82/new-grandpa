import type { Metadata } from "next";
import { getAllRecipes } from "@/utils/recipesData";
import SearchClient from "./search-client";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const title = query
    ? `"${query}" — Search results | Grandpa Tassos Cooking`
    : "Search Recipes | Grandpa Tassos Cooking";
  const description = query
    ? `Recipes matching "${query}" on Grandpa Tassos Cooking.`
    : "Search Grandpa Tassos Cooking's full recipe archive.";

  return {
    title,
    description,
    robots: { index: false, follow: true }, // query pages aren't worth indexing individually
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const recipes = await getAllRecipes();
  return <SearchClient initialQuery={q || ""} recipes={recipes} />;
}
