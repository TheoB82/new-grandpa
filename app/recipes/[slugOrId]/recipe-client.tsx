"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import parse from "html-react-parser";
import { useLanguage } from "@/context/LanguageContext";
import slugify from "@/utils/slugify";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { Recipe } from "@/types/recipe";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Strip diacritics so CSS `uppercase` doesn't show accents on Greek text.
const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function formatDate(dateStr: string, lang: "gr" | "en"): string {
  if (!dateStr) return "";
  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return "";
  return new Date(year, month - 1, day).toLocaleDateString(
    lang === "gr" ? "el-GR" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

/* ------------------------------------------------------------------ */
/* Share + Print buttons                                               */
/* ------------------------------------------------------------------ */

function ShareButtons({ title, lang }: { title: string; lang: "gr" | "en" }) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied]     = useState(false);

  useEffect(() => { setShareUrl(window.location.href); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = "w-4 h-4 inline-block mr-1.5 align-text-bottom";
  const btn  = "flex items-center px-3 py-2.5 rounded-full text-white text-xs font-semibold transition";

  return (
    <div className="flex justify-center flex-wrap gap-2">
      <a
        href={shareUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` : "#"}
        target="_blank"
        className={`${btn} bg-[#3b5998]/80 hover:bg-[#3b5998]`}
      >
        <svg className={icon} fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z"/>
        </svg>
        Facebook
      </a>

      <a
        href={shareUrl ? `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " - " + shareUrl)}` : "#"}
        target="_blank"
        className={`${btn} bg-[#25D366]/80 hover:bg-[#25D366]`}
      >
        <svg className={icon} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 3.9A11.8 11.8 0 0 0 12 .2 11.9 11.9 0 0 0 .3 12 11.7 11.7 0 0 0 2.7 18l-1 4 4.2-1a11.9 11.9 0 0 0 6.1 1.7A11.8 11.8 0 0 0 22 12a11.6 11.6 0 0 0-2-8.1zm-8 17.3a9.6 9.6 0 0 1-4.7-1.2l-.3-.2-2.5.6.5-2.4-.3-.3A9.3 9.3 0 0 1 3.3 12a9.6 9.6 0 0 1 9.6-9.5c2.6 0 5 .9 6.8 2.7a9.4 9.4 0 0 1-6.8 15z"/>
        </svg>
        WhatsApp
      </a>

      <a
        href={shareUrl ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}` : "#"}
        target="_blank"
        className={`${btn} bg-black/70 hover:bg-black`}
      >
        <svg className={icon} fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 3.2 14.8 13l7.5 7.8H18l-5.6-5.9L7 20.8H2.5l7.8-11.1L2 3.2h5.4l5 5.3 5.8-5.3H22z"/>
        </svg>
        X
      </a>

      <button onClick={handleCopy} className={`${btn} bg-[#8c5e3c]/80 hover:bg-[#8c5e3c]`}>
        <svg className={icon} fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        {copied ? (lang === "gr" ? "Αντιγράφηκε!" : "Copied!") : (lang === "gr" ? "Αντιγραφή" : "Copy Link")}
      </button>

      <button onClick={() => window.print()} className={`${btn} bg-white/10 hover:bg-white/20`}>
        <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
        </svg>
        {lang === "gr" ? "Εκτύπωση" : "Print"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Execution steps — timeline style                                    */
/* ------------------------------------------------------------------ */

function ExecutionSteps({ html }: { html: string }) {
  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

  if (liMatches.length > 0) {
    return (
      <ol className="space-y-0">
        {liMatches.map((match, i) => {
          const isLast = i === liMatches.length - 1;
          return (
            <li key={i} className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0 w-10">
                <span className="w-9 h-9 rounded-full bg-[#8c5e3c] text-[#fdd9a1] flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-[#8c5e3c]/30 z-10">
                  {i + 1}
                </span>
                {!isLast && <div className="w-px flex-1 min-h-8 bg-[#8c5e3c]/30 mt-1 mb-1 print:hidden" />}
              </div>
              <div className={`${isLast ? "pb-0" : "pb-8 print:pb-2"} pt-1.5 flex-1 prose prose-invert max-w-none prose-p:mb-0 prose-p:leading-relaxed prose-strong:text-[#fdd9a1]`}>
                {parse(match[1])}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="prose prose-invert max-w-none prose-p:mb-4 prose-strong:text-[#fdd9a1]">
      {parse(html)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading — strips accents before CSS uppercases             */
/* ------------------------------------------------------------------ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  const text = typeof children === "string" ? stripAccents(children) : children;
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold uppercase tracking-widest text-[#fdd9a1]">{text}</h2>
      <div className="mt-2 h-0.5 w-10 bg-[#8c5e3c] rounded-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recipe meta bar — prep/cook time, servings, difficulty, calories    */
/* ------------------------------------------------------------------ */

const DIFFICULTY_GR: Record<string, string> = { Easy: "Εύκολο", Medium: "Μέτριο", Hard: "Δύσκολο" };

function RecipeMeta({ recipe, lang }: { recipe: Recipe; lang: "gr" | "en" }) {
  const iconCls = "w-4 h-4 shrink-0 text-[#fdd9a1]/70";
  const items: { key: string; icon: React.ReactNode; label: string }[] = [];

  if (recipe.PrepTimeMinutes != null) {
    items.push({
      key: "prep",
      icon: (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: `${lang === "gr" ? "Προετ." : "Prep"} ${recipe.PrepTimeMinutes}${lang === "gr" ? "λ." : "m"}`,
    });
  }
  if (recipe.CookTimeMinutes != null) {
    items.push({
      key: "cook",
      icon: (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: `${lang === "gr" ? "Μαγ." : "Cook"} ${recipe.CookTimeMinutes}${lang === "gr" ? "λ." : "m"}`,
    });
  }
  if (recipe.Servings != null) {
    items.push({
      key: "servings",
      icon: (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0" />
        </svg>
      ),
      label: `${recipe.Servings} ${lang === "gr" ? "μερίδες" : "servings"}`,
    });
  }
  if (recipe.Difficulty) {
    items.push({
      key: "difficulty",
      icon: (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      ),
      label: lang === "gr" ? (DIFFICULTY_GR[recipe.Difficulty] || recipe.Difficulty) : recipe.Difficulty,
    });
  }
  if (recipe.CaloriesPerServing != null) {
    items.push({
      key: "calories",
      icon: (
        <svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.4 5.2A8.25 8.25 0 0112 21a8.25 8.25 0 01-5.96-13.95A8.3 8.3 0 009 9.6a9 9 0 013.36-6.87 8.2 8.2 0 003 2.48z" />
        </svg>
      ),
      label: `${recipe.CaloriesEstimated ? "~" : ""}${recipe.CaloriesPerServing} ${lang === "gr" ? "θερμ./μερίδα" : "kcal/serving"}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-6 text-sm text-white/60">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Similar recipes helper                                              */
/* ------------------------------------------------------------------ */

function getSimilarRecipes(allRecipes: Recipe[], current: Recipe, lang: "gr" | "en", limit = 3) {
  const titleKey    = lang === "gr" ? "TitleGR"    : "TitleEN";
  const tagKey      = lang === "gr" ? "TagsGR"     : "TagsEN";
  const categoryKey = lang === "gr" ? "CategoryGR" : "CategoryEN";

  const currentTags: string[] = (() => {
    try { return JSON.parse(current[tagKey] || "[]"); } catch { return []; }
  })();

  return allRecipes
    .filter((r) => r[titleKey] !== current[titleKey])
    .map((r) => {
      let tags: string[] = [];
      try { tags = JSON.parse(r[tagKey] || "[]"); } catch {}
      return {
        recipe: r,
        score: (r[categoryKey] === current[categoryKey] ? 3 : 0) +
               tags.filter(t => currentTags.includes(t)).length,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(e => e.recipe);
}

/* ================================================================== */
/* Main component                                                      */
/* ================================================================== */

export default function RecipeClient({
  recipe,
  recipes = [],
  previewMode = false,
}: {
  recipe: Recipe;
  recipes?: Recipe[];
  previewMode?: boolean;
}) {
  const { lang } = useLanguage();

  const title       = lang === "gr" ? recipe.TitleGR            : recipe.TitleEN;
  const shortDesc   = lang === "gr" ? recipe.ShortDescriptionGR : recipe.ShortDescriptionEN;
  const longDesc    = lang === "gr" ? recipe.LongDescriptionGR  : recipe.LongDescriptionEN;
  const ingredients = lang === "gr" ? recipe.IngredientsGR      : recipe.IngredientsEN;
  const execution   = lang === "gr" ? recipe.ExecutionGR        : recipe.ExecutionEN;
  const category    = lang === "gr" ? recipe.CategoryGR         : recipe.CategoryEN;

  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  const similar = getSimilarRecipes(recipes, recipe, lang);
  const date    = formatDate(recipe.Date, lang);

  return (
    <div className={`${previewMode ? "" : "min-h-screen"} bg-[#3c2718] text-white print-area`}>

      {/* ============================================================ */}
      {/* HERO                                                         */}
      {/* ============================================================ */}
      <div className={`${previewMode ? "pt-8" : "pt-28 lg:pt-32"} pb-14 px-6 border-b border-[#8c5e3c]/20 print:border-0 print:pt-0 print:pb-4`}>

        {/* Back link */}
        {!previewMode && (
          <div className="max-w-4xl mx-auto mb-6 print:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/45 hover:text-white/80 text-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lang === "gr" ? "Όλες οι συνταγές" : "All Recipes"}
            </Link>
          </div>
        )}

        {/* Centered title block */}
        <div className="max-w-3xl mx-auto text-center">
          {category && (
            <span className="inline-block px-3 py-1 mb-5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#8c5e3c]/25 text-[#fdd9a1] border border-[#8c5e3c]/40 print:hidden">
              {stripAccents(category)}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{title}</h1>
          <p className="text-base md:text-lg text-white/65 max-w-xl mx-auto mb-3">{shortDesc}</p>

          <RecipeMeta recipe={recipe} lang={lang} />

          {date && (
            <p className="text-xs text-white/35 mb-8 print:hidden">
              {lang === "gr" ? "Δημοσιεύθηκε" : "Published"} {date}
            </p>
          )}

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-3 mb-6 print:hidden">
            <div className="h-px w-20 bg-linear-to-r from-transparent to-[#8c5e3c]/50" />
            <span className="text-[#8c5e3c] text-sm">✦</span>
            <div className="h-px w-20 bg-linear-to-l from-transparent to-[#8c5e3c]/50" />
          </div>

          <div className="print:hidden">
            <ShareButtons title={title} lang={lang} />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BODY                                                         */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-6 pb-24 print:pb-0">

        {/* VIDEO */}
        {videoID && (
          <div className="mt-12 w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#8c5e3c]/30 print:hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoID}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* LONG DESCRIPTION */}
        {longDesc && (
          <div className="mt-12 rounded-xl bg-[#2e1e12]/60 border-l-4 border-[#8c5e3c] px-6 py-5">
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-white/75 prose-strong:text-[#fdd9a1] prose-h2:text-[#fdd9a1] prose-h2:text-lg italic">
              {parse(longDesc)}
            </div>
          </div>
        )}

        {/* STEPS + INGREDIENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-14">

          <div className="lg:col-span-2">
            <SectionHeading>{lang === "gr" ? "Εκτέλεση" : "Steps"}</SectionHeading>
            <ExecutionSteps html={execution || ""} />
          </div>

          <div>
            <SectionHeading>{lang === "gr" ? "Υλικά" : "Ingredients"}</SectionHeading>
            <div className="bg-[#2e1e12]/70 border border-[#8c5e3c]/40 rounded-xl p-5 shadow-lg">
              <div className="prose prose-invert max-w-none prose-p:mb-2.5 prose-p:text-sm prose-p:text-white/80 prose-li:mb-2 prose-li:text-sm prose-strong:text-[#fdd9a1] prose-u:text-[#fdd9a1] prose-u:no-underline prose-u:font-semibold">
                {parse(ingredients || "")}
              </div>
            </div>
          </div>

        </div>

        {/* SIMILAR RECIPES */}
        {similar.length > 0 && (
          <div className="mt-20 print:hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-[#8c5e3c]/20" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#fdd9a1]/70">
                {lang === "gr" ? "Παρόμοιες Συνταγές" : "You might also like"}
              </h2>
              <div className="h-px flex-1 bg-[#8c5e3c]/20" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similar.map((r, idx) => {
                const simTitle = lang === "gr" ? r.TitleGR : r.TitleEN;
                const simCat   = lang === "gr" ? r.CategoryGR : r.CategoryEN;
                const link     = `/recipes/${slugify(r.TitleEN)}`;
                const vid      = r.LinkYT ? getYoutubeVideoID(r.LinkYT) : null;
                const thumb    = r.Image
                  || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : "/placeholder.jpg");

                return (
                  <Link
                    key={idx}
                    href={link}
                    className="group relative overflow-hidden rounded-xl border border-[#8c5e3c]/30 hover:border-[#8c5e3c]/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={thumb}
                        alt={simTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#1e0f06]/80 via-transparent to-transparent" />
                    </div>
                    <div className="p-4 bg-[#2e1e12]/80">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#fdd9a1]/60 mb-1">
                        {stripAccents(simCat)}
                      </div>
                      <div className="font-semibold text-sm leading-snug text-white/90">{simTitle}</div>
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
