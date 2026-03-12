"use client";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { slugify } from "@/utils/slugify";

export default function RecipeCard({ recipe }) {
  const { lang } = useLanguage();

  const title = lang === "GR" ? recipe.TitleGR : recipe.TitleEN;
  const desc = lang === "GR" ? recipe.ShortDescriptionGR : recipe.ShortDescriptionEN;

    return (
      <Link href={`/recipes/${recipe.ShortID}`} className="card p-4 hover:shadow-lg transition">
        <img src={recipe.Image} className="rounded mb-3" />
        <h3 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      </Link>
    );
}
