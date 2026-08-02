"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

import recipes from "@/data/recipes.json";
import type { Recipe } from "@/types/recipe";
import { categoryMapping } from "@/utils/categoryMapping";
import { matchesCategory } from "@/utils/matchesCategory";
import { searchRecipes } from "@/utils/searchRecipes";
import { parseDate } from "@/utils/parseDate";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/* Other utilities                                                     */
/* ------------------------------------------------------------------ */

function getThumb(url: string) {
  if (!url) return "/placeholder.jpg";
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")           return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    if (u.searchParams.get("v"))             return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/embed/"))    return `https://img.youtube.com/vi/${u.pathname.replace("/embed/", "")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/shorts/"))   return `https://img.youtube.com/vi/${u.pathname.replace("/shorts/", "")}/hqdefault.jpg`;
    return "/placeholder.jpg";
  } catch { return "/placeholder.jpg"; }
}

function isPublished(r: Recipe): boolean {
  if (!r.Date) return true;
  const d = parseDate(r.Date);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d <= today;
}

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ================================================================== */
/* RecipeExplorer                                                      */
/* ================================================================== */

export default function RecipeExplorer() {
  const { lang, selectedCategory, setSelectedCategory, search, setSearch } = useLanguage();

  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(false);

  const categories = categoryMapping[lang];

  const sortedRecipes = useMemo<Recipe[]>(
    () =>
      (recipes as Recipe[])
        .filter(isPublished)
        .slice()
        .sort((a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime()),
    []
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sortedRecipes.length };
    for (const cat of categories) {
      counts[cat.name] = sortedRecipes.filter((r) => matchesCategory(r, cat, lang)).length;
    }
    return counts;
  }, [sortedRecipes, lang, categories]);

  // Filter by category first, then search + relevance-sort within that set.
  const filtered = useMemo(() => {
    const activeCategory = selectedCategory
      ? categories.find((c) => c.name === selectedCategory)
      : null;

    const inCategory = activeCategory
      ? sortedRecipes.filter((r) => matchesCategory(r, activeCategory, lang))
      : sortedRecipes;

    if (!search.trim()) return inCategory; // already sorted by date

    return searchRecipes(inCategory, search);
  }, [sortedRecipes, search, selectedCategory, lang, categories]);

  useEffect(() => { setVisible(12); }, [selectedCategory, search]);

  const visibleRecipes = filtered.slice(0, visible);
  const isSearching = search.trim().length > 0;

  /* ================================================================ */
  /* UI                                                               */
  /* ================================================================ */

  return (
    <div id="recipes-start">

      {/* CATEGORY FILTERS */}
      <div className="relative mb-4">
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-linear-to-l from-[--surface] to-transparent pointer-events-none z-10 sm:hidden" />
        <div className="flex overflow-x-auto gap-2 pb-2 sm:flex-wrap sm:justify-center sm:overflow-x-visible no-scrollbar px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border whitespace-nowrap ${
              !selectedCategory
                ? "bg-[--accent] border-[--accent-secondary] text-white"
                : "bg-[--chip-bg] border-[--chip-border] text-[--text-primary] hover:bg-[--chip-bg-hover]"
            }`}
          >
            {lang === "gr" ? "Όλες" : "All"}
            <span className="ml-1.5 text-xs opacity-60">({categoryCounts.all})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border whitespace-nowrap ${
                selectedCategory === cat.name
                  ? "bg-[--accent] border-[--accent-secondary] text-white"
                  : "bg-[--chip-bg] border-[--chip-border] text-[--text-primary] hover:bg-[--chip-bg-hover]"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-60">({categoryCounts[cat.name] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* RESULT COUNT + clear search */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <p className="text-sm text-[--text-secondary] opacity-60">
            {lang === "gr"
              ? `Εμφάνιση ${Math.min(visible, filtered.length)} από ${filtered.length} συνταγές`
              : `Showing ${Math.min(visible, filtered.length)} of ${filtered.length} recipes`}
          </p>
          {isSearching && (
            <button
              onClick={() => setSearch("")}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[--chip-bg] border border-[--chip-border] text-[--text-secondary] text-xs font-medium hover:bg-[--chip-bg-hover] transition"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {lang === "gr" ? `"${search}"` : `"${search}"`}
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-[--text-primary] mb-2">
            {lang === "gr" ? "Δεν βρέθηκαν συνταγές" : "No recipes found"}
          </h3>
          <p className="text-sm text-[--text-secondary] opacity-70 mb-6">
            {lang === "gr" ? "Δοκίμασε διαφορετική αναζήτηση ή κατηγορία." : "Try a different search term or category."}
          </p>
          <button
            onClick={() => { setSelectedCategory(null); setSearch(""); }}
            className="px-5 py-2 bg-[--accent] text-white rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            {lang === "gr" ? "Εμφάνιση όλων" : "Show all recipes"}
          </button>
        </div>
      )}

      {/* RECIPE GRID */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRecipes.map((r, index) => {
            const title    = lang === "gr" ? r.TitleGR : r.TitleEN;
            const category = lang === "gr" ? r.CategoryGR : r.CategoryEN;
            const desc     = lang === "gr" ? r.ShortDescriptionGR : r.ShortDescriptionEN;

            return (
              <Link
                key={r.TitleEN}
                href={`/recipes/${r.ShortID}`}
                className="card rounded-xl overflow-hidden opacity-0 animate-slideIn group hover:-translate-y-0.5 hover:shadow-xl transition-all"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
              >
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={getThumb(r.LinkYT)}
                    alt={title}
                  />
                </div>
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-semibold rounded-full bg-[#a06b45] text-white uppercase tracking-wide">
                    {stripAccents(category)}
                  </span>
                  <h3 className="font-bold text-base leading-snug mb-1 text-[--text-primary]">{title}</h3>
                  <p className="text-sm text-[--text-secondary] opacity-70 line-clamp-2">{desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* LOAD MORE */}
      {visible < filtered.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => { setVisible(p => p + 12); setLoading(false); }, 300);
            }}
            className={`loadMoreBtn px-6 py-3 bg-[#8c5e3c] text-white font-medium rounded-lg shadow-lg border border-[#d9b08c] transition ${loading ? "loading" : ""}`}
          >
            {loading
              ? (lang === "gr" ? "Φόρτωση..." : "Loading...")
              : (lang === "gr" ? "Φόρτωσε Περισσότερα" : "Load More")}
          </button>
        </div>
      )}
    </div>
  );
}
