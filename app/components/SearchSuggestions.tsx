"use client";

import Link from "next/link";
import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import type { Recipe } from "@/types/recipe";

export default function SearchSuggestions() {
  const { search, setSearch, lang } = useLanguage();

  const [results, setResults] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const filtered = (recipes as Recipe[])
      .filter((r) => {
        const title = lang === "gr" ? r.TitleGR : r.TitleEN;
        return title.toLowerCase().includes(search.toLowerCase());
      })
      .slice(0, 8);

    setResults(filtered);
  }, [search, lang]);

  if (!results.length) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-[#5a3b24] border border-[#8c5e3c] rounded-xl shadow-xl z-50">
      {results.map((r, i) => {
        const title = lang === "gr" ? r.TitleGR : r.TitleEN;
        const slug = slugify(r.TitleEN);

        return (
          <Link
            href={`/recipes/${slug}`}
            key={i}
            onClick={() => setSearch("")}
            className="block px-4 py-2 hover:bg-[#6e4a30]"
          >
            {title}
          </Link>
        );
      })}
    </div>
  );
}
