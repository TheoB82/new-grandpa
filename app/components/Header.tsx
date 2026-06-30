"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { categoryMapping } from "@/utils/categoryMapping";
import logo from "@/../public/logo.png";

/* ----------------------------------------------------------
   MATCH CATEGORY WHEN SWITCHING LANGUAGES
----------------------------------------------------------- */
function translateCategory(
  currentLang: "gr" | "en",
  newLang: "gr" | "en",
  selected: string | null
) {
  if (!selected) return null;

  const currentList = categoryMapping[currentLang];
  const newList = categoryMapping[newLang];

  const found = currentList.find((c) => c.name === selected);
  if (!found) return null;

  return newList.find((c) => c.path === found.path)?.name ?? null;
}

export default function Header() {
  const {
    lang,
    setLang,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
  } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const categories = categoryMapping[lang];

  const goHomeAndTop = () => {
    router.push("/");
    setSelectedCategory(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 150);
  };

  const applyCategory = (name: string | null) => {
    setSelectedCategory(name);
    router.push("/");
    setTimeout(() => {
      const el = document.getElementById("recipes-start");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const activeClass =
    "text-[--header-text] font-semibold border-b-2 border-[--header-text]";
  const inactiveClass =
    "text-[--header-muted] hover:text-[--header-text] transition";

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--header-bg)] text-[var(--header-text)] border-b border-[var(--header-border)] backdrop-blur-md">

      {/* TOP BAR */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">

        {/* LOGO */}
        <button onClick={goHomeAndTop} className="flex items-center gap-3">
          <div className="relative w-[42px] h-[42px]">
            <Image src={logo} alt="Logo" fill className="object-contain rounded" />
          </div>
          <span className="text-sm sm:text-lg font-semibold tracking-wide">
            {lang === "gr"
              ? "Ο παππούς ο Τάσος μαγειρεύει."
              : "Grandpa Tassos Cooking"}
          </span>
        </button>

        {/* SEARCH */}
        <div className="hidden sm:block relative w-64">
          <input
            type="text"
            placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/25 border border-[--header-border] text-[--header-text] placeholder-[--header-muted]"
          />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* LANGUAGE */}
          <div className="hidden sm:flex rounded-md overflow-hidden border border-[--chip-border]">
            {['gr', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  const translated = translateCategory(lang, l as any, selectedCategory);
                  setLang(l as any);
                  setSelectedCategory(translated);
                }}
                className={`px-3 py-1 ${
                  lang === l
                    ? 'bg-[--brand] text-white font-bold border border-[--brand]'
                    : 'bg-[--chip-bg] text-[--brand] border border-[--brand] hover:bg-[--chip-bg-hover]'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* MOBILE MENU */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="sm:hidden px-3 py-2 rounded border border-[--chip-border]"
          >
            ☰
          </button>
        </div>
      </div>

      {/* DESKTOP CATEGORIES */}
      <nav className="hidden sm:flex justify-center gap-6 px-6 py-2 border-t border-[var(--header-border)] bg-[var(--header-bg)]">
        <button
          onClick={() => applyCategory(null)}
          className={selectedCategory === null ? activeClass : inactiveClass}
        >
          {lang === "gr" ? "Όλες" : "All"}
        </button>

        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => applyCategory(c.name)}
            className={selectedCategory === c.name ? activeClass : inactiveClass}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="sm:hidden px-4 py-4 space-y-4 bg-black/20 border-t border-[--header-border]">

          {/* CLOSE + SEARCH row */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg bg-black/30 border border-[--chip-border] text-[--header-text] placeholder-[--header-muted]"
            />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-[--chip-border] text-[--header-text] text-lg"
            >
              ✕
            </button>
          </div>

          {/* LANGUAGE */}
          <div className="flex gap-2">
            {['gr', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  const translated = translateCategory(lang, l as any, selectedCategory);
                  setLang(l as any);
                  setSelectedCategory(translated);
                  setMobileOpen(false);
                }}
                className={`flex-1 py-2.5 rounded border ${
                  lang === l
                    ? 'bg-[--brand] text-white font-bold border border-[--brand]'
                    : 'bg-black/20 text-[--brand] border border-[--brand]'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CATEGORIES */}
          <div className="flex flex-wrap gap-2 justify-center pb-2">
            <button
              onClick={() => { applyCategory(null); setMobileOpen(false); }}
              className={`px-4 py-2.5 rounded-full border ${
                selectedCategory === null
                  ? 'bg-[--brand] text-white font-bold border border-[--brand]'
                  : 'bg-black/20 text-[--brand] border border-[--brand]'
              }`}
            >
              {lang === 'gr' ? 'Όλες' : 'All'}
            </button>

            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => { applyCategory(c.name); setMobileOpen(false); }}
                className={`px-4 py-2.5 rounded-full border ${
                  selectedCategory === c.name
                    ? 'bg-[--brand] text-white font-bold border border-[--brand]'
                    : 'bg-black/20 text-[--brand] border border-[--brand]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
