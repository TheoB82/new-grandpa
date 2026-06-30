"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useMemo } from "react";
import recipes from "@/data/recipes.json";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { parseDate } from "@/utils/parseDate";

const RecipeExplorer = dynamic(() => import("./components/RecipeExplorer"), {
  ssr: false,
});

export default function Home() {
  const { lang } = useLanguage();

  const sortedByDate = useMemo(
    () => [...recipes].sort((a, b) => parseDate(b.Date).getTime() - parseDate(a.Date).getTime()),
    []
  );

  const featured = useMemo(() => sortedByDate.find((r) => r.LinkYT), [sortedByDate]);
  const videoID  = useMemo(() => (featured ? getYoutubeVideoID(featured.LinkYT) : null), [featured]);
  const thumb    = videoID ? `https://img.youtube.com/vi/${videoID}/hqdefault.jpg` : null;

  return (
    <div className="w-full bg-[--bg-strong]">

      {/* ================================================================ */}
      {/* HERO — latest recipe                                             */}
      {/* ================================================================ */}
      {featured && (
        <div className="bg-[#3c2718] text-white">
          <div className="max-w-6xl mx-auto px-6 pt-28 lg:pt-36 pb-12 lg:pb-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#8c5e3c]/30 text-[#fdd9a1] border border-[#8c5e3c]/40">
                {lang === "gr" ? "Τελευταία συνταγή" : "Latest Recipe"}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                {lang === "gr" ? featured.TitleGR : featured.TitleEN}
              </h1>
              <p className="text-white/65 text-base md:text-lg mb-8 max-w-lg mx-auto lg:mx-0">
                {lang === "gr" ? featured.ShortDescriptionGR : featured.ShortDescriptionEN}
              </p>
              <Link
                href={`/recipes/${featured.ShortID}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8c5e3c] hover:bg-[#a06b45] text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                {lang === "gr" ? "Δες τη συνταγή" : "View Recipe"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Thumbnail */}
            {thumb && (
              <Link
                href={`/recipes/${featured.ShortID}`}
                className="shrink-0 w-full lg:w-[460px] group"
              >
                <img
                  src={thumb}
                  alt={lang === "gr" ? featured.TitleGR : featured.TitleEN}
                  className="w-full aspect-video object-cover rounded-2xl shadow-2xl border border-[#8c5e3c]/30 group-hover:scale-[1.02] transition-transform duration-300"
                />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ALL RECIPES                                                      */}
      {/* ================================================================ */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-10 text-[--text-primary]">
          {lang === "en" ? "All Recipes" : "Όλες οι Συνταγές"}
        </h2>
        <div className="bg-[--surface] rounded-2xl p-6 md:p-8 shadow-sm">
          <RecipeExplorer />
        </div>
      </div>

    </div>
  );
}
