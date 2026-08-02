import { getAllRecipes } from "@/utils/recipesData";
import MealPlannerClient from "./meal-planner-client";

export const revalidate = 60;

export default async function MealPlannerPage() {
  const recipes = await getAllRecipes();
  return <MealPlannerClient recipes={recipes} />;
}
