"use client";
import { useLanguage } from "@/app/context/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-4 my-4">
      <button className={lang === "GR" ? "font-bold" : ""} onClick={() => setLang("GR")}>🇬🇷 GR</button>
      <button className={lang === "EN" ? "font-bold" : ""} onClick={() => setLang("EN")}>🇬🇧 EN</button>
    </div>
  );
}
