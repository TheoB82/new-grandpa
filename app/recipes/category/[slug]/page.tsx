import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryMapping } from "@/utils/categoryMapping";
import { getAllRecipes } from "@/utils/recipesData";
import CategoryClient from "./category-client";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findCategory(slug: string) {
  return categoryMapping.en.find((c) => c.path === slug);
}

export function generateStaticParams() {
  return categoryMapping.en.map((c) => ({ slug: c.path }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return {};

  const title = `${category.en} Recipes | Grandpa Tassos Cooking`;
  const description = `Browse ${category.en} (${category.gr}) recipes from Grandpa Tassos Cooking — authentic Greek & Mediterranean dishes.`;

  return {
    title,
    description,
    alternates: { canonical: `/recipes/category/${category.path}` },
    openGraph: {
      title,
      description,
      siteName: "Grandpa Tassos Cooking",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return notFound();

  const recipes = await getAllRecipes();

  return <CategoryClient category={category} recipes={recipes} />;
}
