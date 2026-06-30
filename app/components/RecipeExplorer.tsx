"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

import recipes from "@/data/recipes.json";
import type { Recipe } from "@/types/recipe";
import { categoryMapping } from "@/utils/categoryMapping";
import { parseDate } from "@/utils/parseDate";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/* Search utilities                                                    */
/* ------------------------------------------------------------------ */

function normalize(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ");
}

// Transliterate Greek characters to Latin so typing "pastitsio" finds
// "Παστίτσιο" regardless of the active language.
const GREEK_LATIN: Record<string, string> = {
  α:"a", ά:"a", Α:"a", Ά:"a",
  β:"v", Β:"v",
  γ:"g", Γ:"g",
  δ:"d", Δ:"d",
  ε:"e", έ:"e", Ε:"e", Έ:"e",
  ζ:"z", Ζ:"z",
  η:"i", ή:"i", Η:"i", Ή:"i",
  θ:"th", Θ:"th",
  ι:"i", ί:"i", ϊ:"i", ΐ:"i", Ι:"i", Ί:"i",
  κ:"k", Κ:"k",
  λ:"l", Λ:"l",
  μ:"m", Μ:"m",
  ν:"n", Ν:"n",
  ξ:"x", Ξ:"x",
  ο:"o", ό:"o", Ο:"o", Ό:"o",
  π:"p", Π:"p",
  ρ:"r", Ρ:"r",
  σ:"s", ς:"s", Σ:"s",
  τ:"t", Τ:"t",
  υ:"y", ύ:"y", ϋ:"y", ΰ:"y", Υ:"y", Ύ:"y",
  φ:"f", Φ:"f",
  χ:"x", Χ:"x",
  ψ:"ps", Ψ:"ps",
  ω:"o", ώ:"o", Ω:"o", Ώ:"o",
};

function latinize(str: string): string {
  return str.split("").map(ch => GREEK_LATIN[ch] ?? ch).join("").toLowerCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function fuzzyIncludes(text: string, word: string): boolean {
  if (!text || !word) return false;
  const t = normalize(text);
  const w = normalize(word);
  if (t.includes(w)) return true;
  const maxDist = w.length <= 4 ? 1 : 2;
  for (let i = 0; i <= t.length - w.length; i++) {
    let dist = 0;
    for (let j = 0; j < w.length; j++) {
      if (t[i + j] !== w[j]) dist++;
      if (dist > maxDist) break;
    }
    if (dist <= maxDist) return true;
  }
  return false;
}

// Returns true if `word` matches any searchable field of the recipe,
// including transliterated Greek (cross-language).
function wordMatchesRecipe(r: Recipe, word: string): boolean {
  const ingGR = stripHtml(r.IngredientsGR || "");
  const ingEN = stripHtml(r.IngredientsEN || "");
  const descGR = r.ShortDescriptionGR || "";
  const descEN = r.ShortDescriptionEN || "";

  return (
    fuzzyIncludes(r.TitleGR,   word) ||
    fuzzyIncludes(r.TitleEN,   word) ||
    fuzzyIncludes(r.CategoryGR, word) ||
    fuzzyIncludes(r.CategoryEN, word) ||
    fuzzyIncludes(String(r.TagsGR), word) ||
    fuzzyIncludes(String(r.TagsEN), word) ||
    fuzzyIncludes(descGR, word) ||
    fuzzyIncludes(descEN, word) ||
    fuzzyIncludes(ingGR, word) ||
    fuzzyIncludes(ingEN, word) ||
    // cross-language: Latin search against transliterated Greek title
    fuzzyIncludes(latinize(r.TitleGR), normalize(word)) ||
    fuzzyIncludes(latinize(r.CategoryGR), normalize(word))
  );
}

/* ------------------------------------------------------------------ */
/* Other utilities                                                     */
/* ------------------------------------------------------------------ */

function getThumb(url: string) {
  if (!url) return "/placeholder.jpg";
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")            return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    if (u.searchParams.get("v"))              return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/embed/"))     return `https://img.youtube.com/vi/${u.pathname.replace("/embed/", "")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/shorts/"))    return `https://img.youtube.com/vi/${u.pathname.replace("/shorts/", "")}/hqdefault.jpg`;
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

// Strip diacritics so CSS uppercase doesn't show accent marks on Greek text.
const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ================================================================== */
/* RecipeExplorer                                                      */
/* ================================================================== */

export default function RecipeExplorer() {
  const { lang, selectedCategory, setSelectedCategory, search, setSearch } = useLanguage();

  const [visible, setVisible]   = useState(12);
  const [loading, setLoading]   = useState(false);

  const categories = categoryMapping[lang];

  const sortedRecipes = useMemo<Recipe[]>(
    () =>
      (recipes as Recipe[])
        .filter(isPublished)
        .slice()
        .sort((a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime()),
    []
  );

  // Count recipes per category (mirrors the filter logic).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sortedRecipes.length };
    for (const cat of categories) {
      counts[cat.name] = sortedRecipes.filter((r) => {
        const rCat = lang === "gr" ? r.CategoryGR : r.CategoryEN;
        let tagsEN: string[] = [];
        try {
          const raw = (r as any).TagsEN;
          tagsEN = Array.isArray(raw) ? raw : JSON.parse(raw);
        } catch {}
        return (
          rCat === cat.name ||
          (cat.tagMatch &&
            tagsEN.some(t => t.toLowerCase().trim() === cat.tagMatch!.toLowerCase().trim()))
        );
      }).length;
    }
    return counts;
  }, [sortedRecipes, lang, categories]);

  // Multi-word AND search: every word must match at least one field.
  const filtered = useMemo(() => {
    return sortedRecipes.filter((r) => {
      const category = lang === "gr" ? r.CategoryGR : r.CategoryEN;
      const activeCategory = selectedCategory
        ? categories.find((c) => c.name === selectedCategory)
        : null;

      let tagsEN: string[] = [];
      try {
        const raw = (r as any).TagsEN;
        tagsEN = Array.isArray(raw) ? raw : JSON.parse(raw);
      } catch {}

      const matchesCategory =
        !selectedCategory ||
        category === selectedCategory ||
        (activeCategory?.tagMatch &&
          tagsEN.some(t => t.toLowerCase().trim() === activeCategory.tagMatch!.toLowerCase().trim()));

      if (!search.trim()) return matchesCategory;

      // Split into words; every word must match something on the recipe.
      const words = search.trim().split(/\s+/).filter(Boolean);
      const matchesSearch = words.every(word => wordMatchesRecipe(r, word));

      return matchesSearch && matchesCategory;
    });
  }, [sortedRecipes, search, selectedCategory, lang, categories]);

  // Reset to first page whenever the filter changes.
  useEffect(() => { setVisible(12); }, [selectedCategory, search]);

  const visibleRecipes = filtered.slice(0, visible);

  /* ================================================================ */
  /* UI                                                               */
  /* ================================================================ */

  return (
    <div id="recipes-start">

      {/* CATEGORY FILTERS — horizontal scroll on mobile */}
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

      {/* RESULT COUNT */}
      {filtered.length > 0 && (
        <p className="text-center text-sm text-[--text-secondary] opacity-60 mb-8">
          {lang === "gr"
            ? `Εμφάνιση ${Math.min(visible, filtered.length)} από ${filtered.length} συνταγές`
            : `Showing ${Math.min(visible, filtered.length)} of ${filtered.length} recipes`}
        </p>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-[--text-primary] mb-2">
            {lang === "gr" ? "Δεν βρέθηκαν συνταγές" : "No recipes found"}
          </h3>
          <p className="text-sm text-[--text-secondary] opacity-70 mb-6">
            {lang === "gr"
              ? "Δοκίμασε διαφορετική αναζήτηση ή κατηγορία."
              : "Try a different search term or category."}
          </p>
          <button
            onClick={() => { setSelectedCategory(null); setSearch(""); }}
            className="px-5 py-2 bg-[--accent] text-white rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            {lang === "gr" ? "Εμφάνιση όλων" : "Show all recipes"}
          </button>
        </div>
      )}

      {/* RECIPE GRID — editorial style */}
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
                {/* Edge-to-edge image */}
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={getThumb(r.LinkYT)}
                    alt={title}
                  />
                </div>

                {/* Left-aligned text */}
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
