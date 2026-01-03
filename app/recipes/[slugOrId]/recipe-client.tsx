"use client";
import { useState, useEffect } from "react";


function ShareButtons({ title }: { title: string }) {
  const [shareUrl, setShareUrl] = useState("");

  // Ensure URL is only set on client-side
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const iconClass =
    "w-5 h-5 inline-block mr-2 align-text-bottom";

  return (
    <div className="flex justify-center flex-wrap gap-3 mb-8 mt-4">

      {/* Facebook */}
      <a
        href={
          shareUrl
            ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl
              )}`
            : "#"
        }
        target="_blank"
        className="flex items-center px-4 py-2 bg-[#3b5998] rounded-lg text-white text-sm font-semibold hover:opacity-85 transition shadow"
      >
        <svg
          className={iconClass}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z"/>
        </svg>
        Facebook
      </a>

      {/* WhatsApp */}
      <a
        href={
          shareUrl
            ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
                title + " - " + shareUrl
              )}`
            : "#"
        }
        target="_blank"
        className="flex items-center px-4 py-2 bg-[#25D366] rounded-lg text-white text-sm font-semibold hover:opacity-85 transition shadow"
      >
        <svg
          className={iconClass}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20 3.9A11.8 11.8 0 0 0 12 .2 11.9 11.9 0 0 0 .3 12 11.7 11.7 0 0 0 2.7 18l-1 4 4.2-1a11.9 11.9 0 0 0 6.1 1.7A11.8 11.8 0 0 0 22 12a11.6 11.6 0 0 0-2-8.1zm-8 17.3a9.6 9.6 0 0 1-4.7-1.2l-.3-.2-2.5.6.5-2.4-.3-.3A9.3 9.3 0 0 1 3.3 12a9.6 9.6 0 0 1 9.6-9.5c2.6 0 5 .9 6.8 2.7a9.4 9.4 0 0 1-6.8 15z"/>
        </svg>
        WhatsApp
      </a>

      {/* Twitter/X */}
      <a
        href={
          shareUrl
            ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title
              )}&url=${encodeURIComponent(shareUrl)}`
            : "#"
        }
        target="_blank"
        className="flex items-center px-4 py-2 bg-black rounded-lg text-white text-sm font-semibold hover:bg-[#222] transition shadow"
      >
        <svg
          className={iconClass}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22 3.2 14.8 13l7.5 7.8H18l-5.6-5.9L7 20.8H2.5l7.8-11.1L2 3.2h5.4l5 5.3 5.8-5.3H22z"/>
        </svg>
        X
      </a>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="flex items-center px-4 py-2 bg-[#8c5e3c] rounded-lg text-white text-sm font-semibold hover:bg-[#a06b45] transition shadow"
      >
        <svg
          className={iconClass}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copy Link
      </button>

    </div>
  );
}




import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import { useLanguage } from "@/context/LanguageContext";
import recipes from "@/data/recipes.json";
import slugify from "@/utils/slugify";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { Recipe } from "@/types/recipe";

// ---------------------------------------------------------------------------
// SIMILAR RECIPES
// ---------------------------------------------------------------------------

function getSimilarRecipes(current: Recipe, lang: "gr" | "en", limit = 3) {
  const titleKey = lang === "gr" ? "TitleGR" : "TitleEN";
  const tagKey = lang === "gr" ? "TagsGR" : "TagsEN";
  const categoryKey = lang === "gr" ? "CategoryGR" : "CategoryEN";

  const currentTags: string[] = (() => {
    try {
      return JSON.parse(current[tagKey] || "[]");
    } catch {
      return [];
    }
  })();

  return (recipes as Recipe[])
    .filter((r) => r[titleKey] !== current[titleKey])
    .map((r) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(r[tagKey] || "[]");
      } catch {}

      const sharedTags = tags.filter((t) => currentTags.includes(t)).length;
      const sameCategory = r[categoryKey] === current[categoryKey] ? 1 : 0;

      return {
        recipe: r,
        score: sameCategory * 3 + sharedTags,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function RecipeClient({ recipe }: { recipe: Recipe }) {
  const { lang } = useLanguage();

  const title = lang === "gr" ? recipe.TitleGR : recipe.TitleEN;
  const shortDesc = lang === "gr" ? recipe.ShortDescriptionGR : recipe.ShortDescriptionEN;
  const longDesc = lang === "gr" ? recipe.LongDescriptionGR : recipe.LongDescriptionEN;
  const ingredients = lang === "gr" ? recipe.IngredientsGR : recipe.IngredientsEN;
  const execution = lang === "gr" ? recipe.ExecutionGR : recipe.ExecutionEN;
  const category = lang === "gr" ? recipe.CategoryGR : recipe.CategoryEN;

  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  const similar = getSimilarRecipes(recipe, lang);

  return (
    <div className="min-h-screen bg-[#3c2718] text-white pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto">

        {/* --------------------------------------------------------------- */}
        {/* TITLE + SHORT DESCRIPTION */}
        {/* --------------------------------------------------------------- */}
        <h1 className="text-4xl font-bold mb-4 text-center">{title}</h1>
        <p className="text-lg opacity-90 text-center mb-8 max-w-2xl mx-auto">{shortDesc}</p>

        <ShareButtons title={title} />
        
        {/* --------------------------------------------------------------- */}
        {/* EMBEDDED YOUTUBE VIDEO */}
        {/* --------------------------------------------------------------- */}
        {videoID && (
          <div className="w-full flex justify-center mb-10">
            <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-xl border border-[#8c5e3c]">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoID}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}


        


        {/* --------------------------------------------------------------- */}
        {/* LONG DESCRIPTION */}
        {/* --------------------------------------------------------------- */}
        {longDesc && (
          <div className="prose prose-invert max-w-none mb-10 text-center mx-auto">
            {parse(longDesc)}
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* EXECUTION + INGREDIENTS */}
        {/* --------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">

          {/* EXECUTION */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{lang === "gr" ? "Εκτέλεση" : "Execution"}</h2>
            <div
              className="
                prose prose-invert max-w-none

                /* Paragraph-based (old recipes) */
                prose-p:mb-4
                prose-br:content-['']

                /* List-based (new recipes) */
                prose-ol:list-decimal
                prose-ol:pl-6
                prose-li:mb-4

                /* Shared */
                prose-strong:text-[#fdd9a1]
              "
            >


              {parse(execution || "")}
            </div>
          </div>

          {/* INGREDIENTS (boxed) */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{lang === "gr" ? "Υλικά" : "Ingredients"}</h2>
            <div
              className="
                bg-[#5a3a24] border border-[#8c5e3c] rounded-xl p-6 shadow-lg
                prose prose-invert max-w-none
                prose-p:mb-3
                prose-li:mb-2
                prose-strong:text-[#fdd9a1]
              "
            >
              {parse(ingredients || "")}
            </div>
          </div>

        </div>

        {/* --------------------------------------------------------------- */}
        {/* SIMILAR RECIPES */}
        {/* --------------------------------------------------------------- */}
        {similar.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-6 text-center">
              {lang === "gr" ? "Παρόμοιες Συνταγές" : "Similar Recipes"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {similar.map((r, idx) => {
              const simTitle = lang === "gr" ? r.TitleGR : r.TitleEN;
              const link = `/recipes/${slugify(r.TitleEN)}`;
              const vid = r.LinkYT ? getYoutubeVideoID(r.LinkYT) : null;
              const thumb = vid
                ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
                : r.Image || "/placeholder.jpg";

              return (
                <Link
                  key={idx}
                  href={link}
                  className="bg-[#5a3a24] rounded-xl overflow-hidden border border-[#8c5e3c] shadow hover:bg-[#6e4a30] transition"
                >
                  <img src={thumb} alt={simTitle} className="w-full h-40 object-cover" />

                  <div className="p-4">
                    <div className="text-sm text-[#fdd9a1] mb-1">{category}</div>
                    <div className="font-bold">{simTitle}</div>
                  </div>
                </Link>
              );
            })}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
