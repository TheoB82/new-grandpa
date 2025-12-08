"use client";

import { useState } from "react";
import Link from "next/link";

import recipes from "@/data/recipes.json";
import type { Recipe } from "@/types/recipe";
import slugify from "@/utils/slugify";
import { categoryMapping } from "@/utils/categoryMapping";
import { parseDate } from "@/utils/parseDate";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------- Utility functions ----------------------- */
function normalize(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ");
}

function fuzzyIncludes(text: string, search: string): boolean {
  if (!text || !search) return false;

  const t = normalize(text);
  const s = normalize(search);

  if (t.includes(s)) return true;

  const maxDistance = s.length <= 4 ? 1 : 2;

  for (let i = 0; i <= t.length - s.length; i++) {
    const segment = t.slice(i, i + s.length);

    let dist = 0;
    for (let j = 0; j < s.length; j++) {
      if (segment[j] !== s[j]) dist++;
      if (dist > maxDistance) break;
    }

    if (dist <= maxDistance) return true;
  }

  return false;
}

function getThumb(url: string) {
  if (!url) return "/placeholder.jpg";

  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    }
    if (u.searchParams.get("v")) {
      return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    }
    if (u.pathname.startsWith("/embed/")) {
      const id = u.pathname.replace("/embed/", "");
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.replace("/shorts/", "");
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    return "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

/* ================================================================== */
/*                        RECIPE EXPLORER                             */
/* ================================================================== */

export default function RecipeExplorer() {
  const { lang, selectedCategory, setSelectedCategory, search } = useLanguage();

  // LOAD MORE PAGINATION
  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(false);

  const categories = categoryMapping[lang];

  /* ----------------------------------------------
     SORT NEWEST → OLDEST
  ------------------------------------------------ */
  const sortedRecipes: Recipe[] = (recipes as Recipe[])
    .slice()
    .sort(
      (a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime()
    );

  /* ----------------------------------------------
     FILTER (category + bilingual fuzzy search + tag-based categories)
  ------------------------------------------------ */
  const filtered = sortedRecipes.filter((r: Recipe) => {
    const category = lang === "gr" ? r.CategoryGR : r.CategoryEN;

    // Find selected category object (may contain tagMatch, e.g. Vegetarian)
    const activeCategory = selectedCategory
      ? categories.find((c) => c.name === selectedCategory)
      : null;

    // Parse TagsEN safely (can be stringified JSON or array)
    let tagsEN: string[] = [];
    try {
      const rawTagsEN = (r as any).TagsEN;
      if (Array.isArray(rawTagsEN)) {
        tagsEN = rawTagsEN;
      } else if (typeof rawTagsEN === "string") {
        tagsEN = JSON.parse(rawTagsEN);
      }
    } catch {
      tagsEN = [];
    }

    // CATEGORY MATCH:
    // 1) No category selected → everything matches
    // 2) Direct category match (CategoryEN/GR)
    // 3) Tag-based category match (e.g. Vegetarian via tagMatch)
    const matchesCategory =
      !selectedCategory ||
      category === selectedCategory ||
      (
        activeCategory?.tagMatch &&
        tagsEN.some(
          (tag) =>
            tag.toLowerCase().trim() ===
            activeCategory.tagMatch!.toLowerCase().trim()
        )
      );

    // If no search text, just use category filter
    if (!search.trim()) return matchesCategory;

    // SEARCH MATCH (unchanged)
    const matchesSearch =
      fuzzyIncludes(r.TitleGR, search) ||
      fuzzyIncludes(r.TitleEN, search) ||
      fuzzyIncludes(r.CategoryGR, search) ||
      fuzzyIncludes(r.CategoryEN, search) ||
      fuzzyIncludes(String(r.TagsGR), search) ||
      fuzzyIncludes(String(r.TagsEN), search);

    return matchesSearch && matchesCategory;
  });

  const visibleRecipes = filtered.slice(0, visible);

  /* ================================================================== */
  /*                              UI START                              */
  /* ================================================================== */

  return (
    <div id="recipes-start" className="mt-10">

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap justify-center gap-3 mb-8 text-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition border
            ${
              !selectedCategory
                ? "bg-[#a06b45] border-[#d9b08c]"
                : "bg-[#5a3a24] border-[#8c5e3c] hover:bg-[#6e4a30]"
            }
          `}
        >
          {lang === "gr" ? "Όλες" : "All"}
        </button>

        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition border
              ${
                selectedCategory === cat.name
                  ? "bg-[#a06b45] border-[#d9b08c] text-white"
                  : "bg-[#5a3a24]/40 border-[#8c5e3c]/60 text-[#fce8c8] hover:bg-[#5a3a24]/60"
              }
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* RECIPE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
        {visibleRecipes.map((r, index) => {
          const title = lang === "gr" ? r.TitleGR : r.TitleEN;
          const category = lang === "gr" ? r.CategoryGR : r.CategoryEN;

          return (
            <Link
              key={r.TitleEN}
              href={`/recipes/${slugify(r.TitleEN)}`}
              className="bg-[#5a3a24] hover:bg-[#6e4a30]
                rounded-xl p-4 border border-[#8c5e3c] 
                shadow-md transition opacity-0 animate-slideIn text-center"
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: "forwards",
              }}
            >
              <img
                className="w-full rounded-lg mb-3 shadow mx-auto"
                src={getThumb(r.LinkYT)}
                alt={title}
              />

              <div className="inline-block px-2.5 py-0.5 mb-2 text-[12px] font-semibold rounded-full bg-[#a06b45] border border-[#d9b08c] text-white">
                {category}
              </div>

              <h3 className="font-bold text-lg">{title}</h3>

              <p className="text-sm opacity-75 mt-1">
                {lang === "gr" ? r.ShortDescriptionGR : r.ShortDescriptionEN}
              </p>
            </Link>
          );
        })}
      </div>

      {/* LOAD MORE BUTTON */}
      {visible < filtered.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setVisible((prev) => prev + 12);
                setLoading(false);
              }, 300);
            }}
            className={`loadMoreBtn px-6 py-3 bg-[#8c5e3c] text-white font-medium rounded-lg shadow-lg border border-[#d9b08c] transition ${loading ? "loading" : ""}`}
          >
            {loading
              ? lang === "gr"
                ? "Φόρτωση..."
                : "Loading..."
              : lang === "gr"
              ? "Φόρτωσε Περισσότερα"
              : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
