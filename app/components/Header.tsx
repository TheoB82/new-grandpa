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

  /* ----------------------------------------------------------
     Navigation helpers
  ----------------------------------------------------------- */
  const goHomeAndTop = () => {
    router.push("/");
    setSelectedCategory(null);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 150);
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
    "text-[#ffd9a6] font-semibold border-b-2 border-[#ffd9a6]";
  const inactiveClass =
    "text-[#fce8c8] font-medium hover:text-[#ffdeb3] transition";

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#5a3b24]/95 backdrop-blur-md border-b border-[#8c5e3c]">

      {/* ----------------------------------------------------------
          TOP BAR (Logo + Search + Social + Language + Mobile Menu)
      ----------------------------------------------------------- */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">

        {/* LOGO + TITLE */}
        <button
          onClick={goHomeAndTop}
          className="flex items-center gap-2 sm:gap-4 shrink min-w-0"
        >
          <div className="relative w-[40px] h-[40px] sm:w-[45px] sm:h-[45px]">
            <Image
              src={logo}
              alt="Logo"
              fill
              className="object-contain rounded"
            />
          </div>

          <span className="text-[15px] sm:text-lg font-semibold tracking-wide text-[#fce8c8] leading-tight">
            {lang === "gr"
              ? "Ο παππούς ο Τάσος μαγειρεύει."
              : "Grandpa Tassos Cooking"}
          </span>
        </button>

        {/* DESKTOP SEARCH */}
        <div className="hidden sm:block relative w-64">
          <input
            type="text"
            placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg bg-[#3c2718]
              border border-[#8c5e3c] text-white placeholder-gray-300
            "
          />

          <SearchSuggestions />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* DESKTOP SOCIAL ICONS */}
          <div className="hidden sm:flex items-center gap-4 text-white">

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@GrandpaTassoscooking"
              target="_blank"
              className="hover:text-red-500 transition"
              aria-label="YouTube"
            >
              <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-1-2.1-1.1C17.1 2.5 12 2.5 12 2.5h-.1s-5.1 0-8.6.3c-.4 0-1.3.2-2.1 1.1C.7 4.6.5 6.2.5 6.2S0 8.1 0 10v1.9c0 1.9.5 3.8.5 3.8s.2 1.6.8 2.3c.8.9 1.9 0.9 2.4 1C6.9 19.5 12 19.5 12 19.5s5.1 0 8.6-.3c.4 0 1.3-.2 2.1-1.1.6-.7.8-2.3.8-2.3s.5-1.9.5-3.8v-1.9c0-1.9-.5-3.8-.5-3.8zM9.8 14.6V7.9l6.3 3.3-6.3 3.4z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/grandpatassoscooking"
              target="_blank"
              className="hover:text-blue-500 transition"
              aria-label="Facebook"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.494V14.706H9.847v-3.622h2.973V8.413c0-2.938 1.793-4.543 4.412-4.543 1.255 0 2.334.093 2.647.135v3.07h-1.816c-1.428 0-1.704.679-1.704 1.673v2.188h3.406l-.444 3.622h-2.962V24h5.807C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/grandpa_tassos_cooking/"
              target="_blank"
              className="hover:text-pink-400 transition"
              aria-label="Instagram"
            >
              <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2 .3 2.5.5.6.3 1 .6 1.4 1.1.4.4.8.8 1.1 1.4.2.5.4 1.3.5 2.5.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2-.5 2.5-.3.6-.6 1-1.1 1.4-.4.4-.8.8-1.4 1.1-.5.2-1.3.4-2.5.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2-.3-2.5-.5-.6-.3-1-.6-1.4-1.1-.4-.4-.8-.8-1.1-1.4-.2-.5-.4-1.3-.5-2.5C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2 .5-2.5.3-.6.6-1 1.1-1.4.4-.4.8-.8 1.4-1.1.5-.2 1.3-.4 2.5-.5C8.4 2.2 8.8 2.2 12 2.2zm0 8.9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zm5.8-4.4a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0z"/>
              </svg>
            </a>
          </div>

          {/* DESKTOP LANGUAGE */}
          <div className="hidden sm:flex border border-[#8c5e3c] rounded">
            <button
              onClick={() => {
                const translated = translateCategory(lang, "gr", selectedCategory);
                setLang("gr");
                setSelectedCategory(translated);
              }}
              className={`px-3 py-1 ${
                lang === "gr" ? "bg-[#8c5e3c]" : "bg-[#3c2718]"
              }`}
            >
              GR
            </button>
            <button
              onClick={() => {
                const translated = translateCategory(lang, "en", selectedCategory);
                setLang("en");
                setSelectedCategory(translated);
              }}
              className={`px-3 py-1 border-l border-[#8c5e3c] ${
                lang === "en" ? "bg-[#8c5e3c]" : "bg-[#3c2718]"
              }`}
            >
              EN
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="sm:hidden px-3 py-2 border border-[#8c5e3c] rounded text-lg"
          >
            ☰
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------
          MOBILE SEARCH + SUGGESTIONS
      ----------------------------------------------------------- */}
      <div className="sm:hidden relative px-3 pb-2">
        <input
          type="text"
          placeholder={lang === "gr" ? "Αναζήτηση..." : "Search..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full px-3 py-2 rounded-lg bg-[#3c2718]
            border border-[#8c5e3c] text-white placeholder-gray-300
          "
        />
        <SearchSuggestions />
      </div>

      {/* ----------------------------------------------------------
          DESKTOP CATEGORY NAV
      ----------------------------------------------------------- */}
      <nav className="hidden sm:flex gap-6 px-6 py-2 bg-[#3c2718] border-t border-[#8c5e3c] justify-center">
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

      {/* ----------------------------------------------------------
          MOBILE MENU
      ----------------------------------------------------------- */}
      {mobileOpen && (
        <div className="sm:hidden bg-[#3c2718] border-t border-[#8c5e3c] px-4 py-3 space-y-4">

          {/* Language */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const translated = translateCategory(lang, "gr", selectedCategory);
                setLang("gr");
                setSelectedCategory(translated);
              }}
              className={`flex-1 py-2 border border-[#8c5e3c] rounded ${
                lang === "gr" ? "bg-[#8c5e3c]" : "bg-[#5a3b24]"
              }`}
            >
              GR
            </button>
            <button
              onClick={() => {
                const translated = translateCategory(lang, "en", selectedCategory);
                setLang("en");
                setSelectedCategory(translated);
              }}
              className={`flex-1 py-2 border border-[#8c5e3c] rounded ${
                lang === "en" ? "bg-[#8c5e3c]" : "bg-[#5a3b24]"
              }`}
            >
              EN
            </button>
          </div>

          {/* Mobile Social Icons */}
          <div className="flex justify-center gap-6 text-white pt-2">

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@GrandpaTassos"
              target="_blank"
              aria-label="YouTube"
              className="hover:text-red-500 transition"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-1-2.1-1.1C17.1 2.5 12 2.5 12 2.5h-.1s-5.1 0-8.6.3c-.4 0-1.3.2-2.1 1.1C.7 4.6.5 6.2.5 6.2S0 8.1 0 10v1.9c0 1.9.5 3.8.5 3.8s.2 1.6.8 2.3c.8.9 1.9 0.9 2.4 1C6.9 19.5 12 19.5 12 19.5s5.1 0 8.6-.3c.4 0 1.3-.2 2.1-1.1.6-.7.8-2.3.8-2.3s.5-1.9.5-3.8v-1.9c0-1.9-.5-3.8-.5-3.8zM9.8 14.6V7.9l6.3 3.3-6.3 3.4z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com"
              target="_blank"
              aria-label="Facebook"
              className="hover:text-blue-500 transition"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.494V14.706H9.847v-3.622h2.973V8.413c0-2.938 1.793-4.543 4.412-4.543 1.255 0 2.334.093 2.647.135v3.07h-1.816c-1.428 0-1.704.679-1.704 1.673v2.188h3.406l-.444 3.622h-2.962V24h5.807C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              aria-label="Instagram"
              className="hover:text-pink-400 transition"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2 .3 2.5.5.6.3 1 .6 1.4 1.1.4.4.8.8 1.1 1.4.2.5.4 1.3.5 2.5.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2-.5 2.5-.3.6-.6 1-1.1 1.4-.4.4-.8.8-1.4 1.1-.5.2-1.3.4-2.5.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2-.3-2.5-.5-.6-.3-1-.6-1.4-1.1-.4-.4-.8-.8-1.1-1.4-.2-.5-.4-1.3-.5-2.5C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2 .5-2.5.3-.6.6-1 1.1-1.4.4-.4.8-.8 1.4-1.1.5-.2 1.3-.4 2.5-.5C8.4 2.2 8.8 2.2 12 2.2zm0 8.9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zm5.8-4.4a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0z"/>
              </svg>
            </a>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => applyCategory(null)}
              className={`px-4 py-2 rounded-full border ${
                selectedCategory === null
                  ? "bg-[#a06b45] border-[#d9b08c]"
                  : "bg-[#5a3b24] border-[#8c5e3c]"
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
                    ? "bg-[#a06b45] border-[#d9b08c]"
                    : "bg-[#5a3b24] border-[#8c5e3c]"
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
