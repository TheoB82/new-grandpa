"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Recipe } from "@/types/recipe";
import { searchRecipes } from "@/utils/searchRecipes";
import { useLanguage } from "@/context/LanguageContext";

function getThumb(photoUrl: string | undefined, url: string) {
  if (photoUrl) return photoUrl;
  if (!url) return "/placeholder.jpg";
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    if (u.searchParams.get("v")) return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/embed/")) return `https://img.youtube.com/vi/${u.pathname.replace("/embed/", "")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/shorts/")) return `https://img.youtube.com/vi/${u.pathname.replace("/shorts/", "")}/hqdefault.jpg`;
    return "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

const DIFFICULTY_GR: Record<string, string> = { Easy: "Εύκολο", Medium: "Μέτριο", Hard: "Δύσκολο" };

// Compact "45m · Easy" line for recipe cards — total time + difficulty, omitted if neither is set.
function cardMeta(r: Recipe, lang: "gr" | "en"): string {
  const totalMinutes = (r.PrepTimeMinutes ?? 0) + (r.CookTimeMinutes ?? 0);
  const parts: string[] = [];
  if (totalMinutes > 0) parts.push(`${totalMinutes}${lang === "gr" ? "λ." : "m"}`);
  if (r.Difficulty) parts.push(lang === "gr" ? (DIFFICULTY_GR[r.Difficulty] || r.Difficulty) : r.Difficulty);
  return parts.join(" · ");
}

export default function SearchClient({ initialQuery, recipes }: { initialQuery: string; recipes: Recipe[] }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  // Keep the URL in sync as the user refines their search, so results stay shareable.
  useEffect(() => {
    const trimmed = query.trim();
    const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    const timeout = setTimeout(() => router.replace(url), 300);
    return () => clearTimeout(timeout);
  }, [query, router]);

  const results = useMemo(() => searchRecipes(recipes, query), [recipes, query]);
  const isSearching = query.trim().length > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 lg:pt-32 pb-16">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[--text-secondary] opacity-70 hover:opacity-100 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {lang === "gr" ? "Όλες οι συνταγές" : "All recipes"}
        </Link>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[--text-primary]">
        {lang === "gr" ? "Αναζήτηση Συνταγών" : "Search Recipes"}
      </h1>

      <div className="relative max-w-lg mb-8">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
          className="w-full py-3 px-4 rounded-lg border border-[--chip-border] bg-[--surface] text-[--text-primary] placeholder-[--text-secondary]"
        />
      </div>

      {isSearching && (
        <p className="text-sm text-[--text-secondary] opacity-60 mb-8">
          {lang === "gr"
            ? `Βρέθηκαν ${results.length} συνταγές για "${query}"`
            : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      {isSearching && results.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <p className="text-[--text-secondary] opacity-70">
            {lang === "gr" ? "Δεν βρέθηκαν συνταγές." : "No recipes found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.slice(0, 60).map((r, index) => {
            const title = lang === "gr" ? r.TitleGR : r.TitleEN;
            const desc = lang === "gr" ? r.ShortDescriptionGR : r.ShortDescriptionEN;
            const meta = cardMeta(r, lang);
            return (
              <Link
                key={r.ShortID}
                href={`/recipes/${r.ShortID}`}
                className="card rounded-xl overflow-hidden opacity-0 animate-slideIn group hover:-translate-y-0.5 hover:shadow-xl transition-all"
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: "forwards" }}
              >
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={getThumb(r.Image, r.LinkYT)}
                    alt={title}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base leading-snug mb-1 text-[--text-primary]">{title}</h3>
                  <p className="text-sm text-[--text-secondary] opacity-70 line-clamp-2">{desc}</p>
                  {meta && <p className="mt-1.5 text-xs text-[--text-secondary] opacity-50">{meta}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
