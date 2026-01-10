"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { categoryMapping } from "@/utils/categoryMapping";
import SearchSuggestions from "@/components/SearchSuggestions";
import logo from "@/../public/logoXmas.png";

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
    "text-[var(--header-text)] font-semibold border-b-2 border-[var(--header-text)]";
  const inactiveClass =
    "text-[var(--header-muted)] hover:text-[var(--header-text)] transition";

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
            className="w-full px-3 py-2 rounded-lg bg-black/25 border border-[var(--header-border)] text-[var(--header-text)] placeholder-[var(--header-muted)]"
          />
          <SearchSuggestions />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* LANGUAGE */}
          <div className="hidden sm:flex rounded-md overflow-hidden border border-[var(--chip-border)]">
            {["gr", "en"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  const translated = translateCategory(lang, l as any, selectedCategory);
                  setLang(l as any);
                  setSelectedCategory(translated);
                }}
                className={`px-3 py-1 ${
                  lang === l
                    ? "bg-white/25"
                    : "bg-[var(--chip-bg)] hover:bg-[var(--chip-bg-hover)]"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* MOBILE MENU */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="sm:hidden px-3 py-2 rounded border border-[var(--chip-border)]"
          >
            ☰
          </button>
        </div>
      </div>

      {/* DESKTOP CATEGORIES */}
      <nav className="hidden sm:flex justify-center gap-6 px-6 py-2 border-t border-[var(--header-border)] bg-black/15">
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
        <div className="sm:hidden px-4 py-4 space-y-4 bg-black/20 border-t border-[var(--header-border)]">

          {/* SEARCH */}
          <input
            type="text"
            placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-[var(--chip-border)] text-[var(--header-text)] placeholder-[var(--header-muted)]"
          />

          {/* LANGUAGE */}
          <div className="flex gap-2">
            {["gr", "en"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  const translated = translateCategory(lang, l as any, selectedCategory);
                  setLang(l as any);
                  setSelectedCategory(translated);
                }}
                className={`flex-1 py-2 rounded border ${
                  lang === l
                    ? "bg-white/25 border-white/40"
                    : "bg-black/20 border-[var(--chip-border)]"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CATEGORIES */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => applyCategory(null)}
              className={`px-4 py-2 rounded-full border ${
                selectedCategory === null
                  ? "bg-white/25 border-white/40"
                  : "bg-black/20 border-[var(--chip-border)]"
              }`}
            >
              {lang === "gr" ? "Όλες" : "All"}
            </button>

            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => applyCategory(c.name)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCategory === c.name
                    ? "bg-white/25 border-white/40"
                    : "bg-black/20 border-[var(--chip-border)]"
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
