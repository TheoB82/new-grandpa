import type { MetadataRoute } from "next";
import recipes from "@/data/recipes.json";
import { categoryMapping } from "@/utils/categoryMapping";
import { parseDate } from "@/utils/parseDate";
import type { Recipe } from "@/types/recipe";

const BASE_URL = "https://www.grandpatassos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/media-kit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categoryMapping.en.map((cat) => ({
    url: `${BASE_URL}/recipes/category/${cat.path}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const recipePages: MetadataRoute.Sitemap = (recipes as Recipe[]).map((r) => ({
    url: `${BASE_URL}/recipes/${r.ShortID}`,
    lastModified: parseDate(r.Date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...recipePages];
}
