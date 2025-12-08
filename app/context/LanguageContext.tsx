"use client";

import { createContext, useContext, useState } from "react";

export type Language = "gr" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;

  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;

  search: string;
  setSearch: (value: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("gr");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ADD SEARCH HERE ❗
  const [search, setSearch] = useState("");

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        selectedCategory,
        setSelectedCategory,
        search,
        setSearch, // ← ADDED
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
