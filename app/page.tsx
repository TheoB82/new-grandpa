import { getAllRecipes } from "@/utils/recipesData";
import HomeClient from "./home-client";

export const revalidate = 60;

export default async function Home() {
  const recipes = await getAllRecipes();
  return <HomeClient recipes={recipes} />;
}
