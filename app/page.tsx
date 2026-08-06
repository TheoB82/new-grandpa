import { getAllRecipes } from "@/utils/recipesData";
import HomeClient from "./home-client";

export const revalidate = 3600;

export default async function Home() {
  const recipes = await getAllRecipes();
  return <HomeClient recipes={recipes} />;
}
