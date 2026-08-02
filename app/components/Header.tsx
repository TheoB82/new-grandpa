"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

  const goToSearch = () => {
    const q = search.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

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
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="relative w-56">
            <input
              type="text"
              placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToSearch();
              }}
              className={`w-full py-2 rounded-lg bg-black/25 border border-[--header-border] text-[--header-text] placeholder-[--header-muted] ${search ? "pl-3 pr-8" : "px-3"}`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[--header-muted] hover:text-[--header-text] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={goToSearch}
            aria-label="Search"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[--brand] text-white hover:opacity-90 transition shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* PAGE LINKS — desktop only */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/meal-planner" className={inactiveClass}>
              {lang === "gr" ? "Γεύματα" : "Meal Planner"}
            </Link>
            <Link href="/about" className={inactiveClass}>
              {lang === "gr" ? "Ο Παππούς" : "About"}
            </Link>
          </div>

          {/* SOCIAL ICONS — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[
              { label: "YouTube",   href: "https://www.youtube.com/@GrandpaTassoscooking", icon: <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/> },
              { label: "Facebook",  href: "https://www.facebook.com/grandpatassos.cooking.3", icon: <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z"/> },
              { label: "Instagram", href: "https://www.instagram.com/grandpa_tassos_cooking/", icon: <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9C.3 21.3 2.7 23.7 7.1 23.9c1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/> },
              { label: "TikTok",    href: "https://www.tiktok.com/@grandpa_tassos_cooking", icon: <path d="M19.6 3a4.6 4.6 0 0 1-4.6-4.6h-3v14.5a2.7 2.7 0 1 1-2-2.6V7a6.7 6.7 0 1 0 5.7 6.6V8.4a7.5 7.5 0 0 0 4.6 1.6V6.6A4.6 4.6 0 0 1 19.6 3z"/> },
              { label: "Pinterest", href: "https://de.pinterest.com/ta23bra/", icon: <path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.1 9.4 7.6 11.2-.1-1-.2-2.5.1-3.6.2-.9 1.5-6.4 1.5-6.4s-.4-.8-.4-1.9c0-1.8 1-3.1 2.3-3.1 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1.1 4.2-.3 1.3.6 2.3 1.9 2.3 2.3 0 3.8-2.9 3.8-6.4 0-2.6-1.8-4.5-4.8-4.5-3.4 0-5.5 2.6-5.5 5.3 0 1 .3 1.6.8 2.2.2.3.3.4.1 1-.1.3-.3 1.1-.4 1.4-.1.5-.5.7-.9.5-1.7-.7-2.5-2.6-2.5-4.7 0-3.8 3.1-8.3 9.3-8.3 4.9 0 8.1 3.6 8.1 7.4 0 5-2.8 8.7-6.7 8.7-1.3 0-2.6-.7-3-1.5l-.8 3.2c-.3 1.1-1.1 2.5-1.6 3.3.9.3 1.9.4 2.9.4 6.6 0 12-5.4 12-12S18.6 0 12 0z"/> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="w-7 h-7 flex items-center justify-center rounded-full text-[--header-text] opacity-70 hover:opacity-100 hover:text-[--header-muted] transition">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
              </a>
            ))}
          </div>

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
      <nav className="hidden sm:flex justify-center gap-6 px-6 py-2 border-t border-(--header-border) bg-(--header-bg)">
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

          {/* SEARCH + submit row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setMobileOpen(false);
                    goToSearch();
                  }
                }}
                className={`w-full py-2.5 rounded-lg bg-black/30 border border-[--chip-border] text-[--header-text] placeholder-[--header-muted] ${search ? "pl-3 pr-8" : "px-3"}`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[--header-muted] hover:text-[--header-text] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Search icon — closes menu, navigates to /search */}
            <button
              onClick={() => {
                setMobileOpen(false);
                goToSearch();
              }}
              aria-label="Search"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[--brand] text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
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

            <Link
              href="/meal-planner"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-full bg-black/20 text-[--brand] border border-[--brand]"
            >
              {lang === "gr" ? "Γεύματα" : "Meal Planner"}
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-full bg-black/20 text-[--brand] border border-[--brand]"
            >
              {lang === "gr" ? "Ο Παππούς" : "About"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
