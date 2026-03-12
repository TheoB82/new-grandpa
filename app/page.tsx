"use client";


import dynamic from "next/dynamic";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import Head from "next/head";

import { useMemo } from "react";
import recipes from "@/data/recipes.json";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

const RecipeExplorer = dynamic(() => import("./components/RecipeExplorer"), {
  ssr: false,
});

// Helper to parse DD/MM/YYYY
function parseRecipeDate(d: string) {
  const [day, month, year] = d.split("/").map(Number);
  return new Date(year, month - 1, day);
}

export default function Home() {
  const { lang } = useLanguage();


  const sortedByDate = useMemo(() => {
    return [...recipes].sort((a, b) => {
      const da = parseRecipeDate(a.Date);
      const db = parseRecipeDate(b.Date);
      return db.getTime() - da.getTime();
    });
  }, []);

  const recentWithVideo = useMemo(() => sortedByDate.find((r) => r.LinkYT), [sortedByDate]);
  const videoID = useMemo(() => recentWithVideo ? getYoutubeVideoID(recentWithVideo.LinkYT) : null, [recentWithVideo]);

  return (
    <>
      <Head>
        <title>{lang === "en" ? "Recipes | Grandpa Tassos" : "Συνταγές | Grandpa Tassos"}</title>
        <meta name="description" content={lang === "en" ? "Discover delicious vegan and traditional recipes from Grandpa Tassos." : "Ανακαλύψτε νόστιμες vegan και παραδοσιακές συνταγές από τον Παππού Τάσσο."} />
      </Head>
      <div className="w-full bg-[--bg-strong]">
        <div className="max-w-6xl mx-auto px-6 py-12 mt-24">

          {/* LOGO */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt={lang === "en" ? "Grandpa Tassos Logo" : "Λογότυπο Παππού Τάσσου"}
              width={200}
              height={200}
              priority
            />
          </div>

          {/* TITLE */}
          <h1 className="text-5xl font-bold text-center mb-12 text-[--text-primary]">
            {lang === "en" ? "Recipes" : "Συνταγές"}
          </h1>

          {/* CONTENT SURFACE */}
          <div className="bg-[--surface] rounded-2xl p-6 md:p-8 shadow-sm">
            <RecipeExplorer />
          </div>

        </div>
      </div>
    </>
  );
}
