"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

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

  const sortedByDate = [...recipes].sort((a, b) => {
    const da = parseRecipeDate(a.Date);
    const db = parseRecipeDate(b.Date);
    return db.getTime() - da.getTime();
  });

  const recentWithVideo = sortedByDate.find((r) => r.LinkYT);
  const videoID = recentWithVideo
    ? getYoutubeVideoID(recentWithVideo.LinkYT)
    : null;

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-10 pt-32">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logoXmas.png"
            alt="Logo"
            width={200}
            height={200}
            priority
          />
        </div>

        {/* TITLE */}
        <h1 className="text-5xl font-bold text-center mb-10">
          {lang === "en" ? "Recipes" : "Συνταγές"}
        </h1>

        {/* MAIN RECIPE EXPLORER */}
        <RecipeExplorer />
      </div>
    </div>
  );
}
