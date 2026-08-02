"use client";

import Link from "next/link";
import type { Recipe } from "@/types/recipe";
import type { CategoryItem } from "@/utils/categoryMapping";
import { categoryMapping } from "@/utils/categoryMapping";
import { matchesCategory } from "@/utils/matchesCategory";
import { parseDate } from "@/utils/parseDate";
import { useLanguage } from "@/context/LanguageContext";

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

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

export default function CategoryClient({ category, recipes }: { category: CategoryItem; recipes: Recipe[] }) {
  const { lang } = useLanguage();
  const displayName = lang === "gr" ? category.gr : category.en;

  const matched = recipes
    .filter((r) => matchesCategory(r, category, lang))
    .sort((a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime());

  const otherCategories = categoryMapping[lang].filter((c) => c.path !== category.path && c.en !== category.en);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 lg:pt-32 pb-16">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[--text-secondary] opacity-70 hover:opacity-100 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {lang === "gr" ? "Όλες οι συνταγές" : "All recipes"}
        </Link>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[--text-primary]">{displayName}</h1>
      <p className="text-[--text-secondary] opacity-60 mb-8">
        {lang === "gr" ? `${matched.length} συνταγές` : `${matched.length} recipe${matched.length === 1 ? "" : "s"}`}
      </p>

      {/* Other categories */}
      <div className="flex flex-wrap gap-2 mb-10">
        {otherCategories.map((c) => (
          <Link
            key={c.path}
            href={`/recipes/category/${categoryMapping.en.find((e) => e.en === c.en)?.path ?? c.path}`}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-[--chip-border] bg-[--chip-bg] text-[--text-primary] hover:bg-[--chip-bg-hover] transition whitespace-nowrap"
          >
            {stripAccents(c.name)}
          </Link>
        ))}
      </div>

      {matched.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍳</div>
          <p className="text-[--text-secondary] opacity-70">
            {lang === "gr" ? "Δεν βρέθηκαν συνταγές σε αυτή την κατηγορία." : "No recipes found in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matched.map((r, index) => {
            const title = lang === "gr" ? r.TitleGR : r.TitleEN;
            const desc = lang === "gr" ? r.ShortDescriptionGR : r.ShortDescriptionEN;
            const meta = cardMeta(r, lang);
            return (
              <Link
                key={r.ShortID}
                href={`/recipes/${r.ShortID}`}
                className="card rounded-xl overflow-hidden opacity-0 animate-slideIn group hover:-translate-y-0.5 hover:shadow-xl transition-all"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
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
