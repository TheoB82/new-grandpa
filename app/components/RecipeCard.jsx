"use client";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { slugify } from "@/utils/slugify";

export default function RecipeCard({ recipe }) {
  const { lang } = useLanguage();

  const title = lang === "GR" ? recipe.TitleGR : recipe.TitleEN;
  const desc = lang === "GR" ? recipe.ShortDescriptionGR : recipe.ShortDescriptionEN;

  return (
    <Link href={`/recipes/${slugify(recipe.TitleEN)}`}className="block border p-4 rounded shadow hover:shadow-lg">
      <img src={recipe.Image} className="rounded mb-3" />
      <h3 className="font-bold text-xl">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </Link>
  );
}
