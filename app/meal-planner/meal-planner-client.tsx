"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import type { Recipe } from "@/types/recipe";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";
import { suggestWeek, suggestReplacement, getWeekStart, type DayPlan } from "@/utils/mealPlanner";

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function getThumb(photoUrl: string | undefined, url: string) {
  if (photoUrl) return photoUrl;
  if (!url) return "/placeholder.jpg";
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    if (u.searchParams.get("v")) return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/embed/")) return `https://img.youtube.com/vi/${u.pathname.replace("/embed/", "")}/hqdefault.jpg`;
    if (u.pathname.startsWith("/shorts/")) return `https://img.youtube.com/vi/${u.pathname.replace("/shorts/", "")}/hqdefault.jpg`;
    return "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

const DIFFICULTY_GR: Record<string, string> = { Easy: "Εύκολο", Medium: "Μέτριο", Hard: "Δύσκολο" };
function cardMeta(r: Recipe, lang: "gr" | "en"): string {
  const totalMinutes = (r.PrepTimeMinutes ?? 0) + (r.CookTimeMinutes ?? 0);
  const parts: string[] = [];
  if (totalMinutes > 0) parts.push(`${totalMinutes}${lang === "gr" ? "λ." : "m"}`);
  if (r.Difficulty) parts.push(lang === "gr" ? (DIFFICULTY_GR[r.Difficulty] || r.Difficulty) : r.Difficulty);
  return parts.join(" · ");
}

const DAY_NAMES: Record<"gr" | "en", string[]> = {
  gr: ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

const CATEGORY_LABEL: Record<string, { gr: string; en: string }> = {
  produce: { gr: "Λαχανικά & Φρούτα", en: "Produce" },
  dairy_eggs: { gr: "Γαλακτικά & Αυγά", en: "Dairy & Eggs" },
  meat_fish: { gr: "Κρέας & Ψάρι", en: "Meat & Fish" },
  pantry: { gr: "Ντουλάπι", en: "Pantry" },
  bakery: { gr: "Αρτοποιείο", en: "Bakery" },
  other: { gr: "Άλλα", en: "Other" },
};

type ShoppingItem = { name: string; quantity: string; category: string };

type StoredDay = { dateISO: string; isFasting: boolean; fastingPeriod?: string; recipeShortId: string | null };
type StoredState = {
  weekStartISO: string;
  familySize: number;
  fastingEnabled: boolean;
  days: StoredDay[];
  shoppingList?: ShoppingItem[] | null;
  checkedItems?: Record<string, boolean>;
};

const STORAGE_KEY = "mealPlan:v1";

function toStoredDays(plan: DayPlan[]): StoredDay[] {
  return plan.map((d) => ({
    dateISO: d.date.toISOString(),
    isFasting: d.isFasting,
    fastingPeriod: d.fastingPeriod,
    recipeShortId: d.recipe?.ShortID ?? null,
  }));
}

function fromStoredDays(stored: StoredDay[], recipes: Recipe[]): DayPlan[] {
  return stored.map((d) => ({
    date: new Date(d.dateISO),
    isFasting: d.isFasting,
    fastingPeriod: d.fastingPeriod,
    recipe: d.recipeShortId ? recipes.find((r) => r.ShortID === d.recipeShortId) ?? null : null,
  }));
}

export default function MealPlannerClient({ recipes }: { recipes: Recipe[] }) {
  const { lang } = useLanguage();

  // Not yet public — gated behind the same admin password until this is fully worked out.
  const [unlocked, setUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState("");
  const [checkingGate, setCheckingGate] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [familySize, setFamilySize] = useState(4);
  const [fastingEnabled, setFastingEnabled] = useState(true);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[] | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [generatingList, setGeneratingList] = useState(false);
  const [listError, setListError] = useState("");

  const [email, setEmail] = useState("");
  const [alsoSubscribe, setAlsoSubscribe] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  // Hydrate from localStorage on mount, or generate a fresh week for the current Mon–Sun.
  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredState = JSON.parse(raw);
        if (stored.weekStartISO === weekStart.toISOString()) {
          setFamilySize(stored.familySize || 4);
          setFastingEnabled(stored.fastingEnabled ?? true);
          setWeekPlan(fromStoredDays(stored.days, recipes));
          setShoppingList(stored.shoppingList ?? null);
          setCheckedItems(stored.checkedItems ?? {});
          setHydrated(true);
          return;
        }
      }
    } catch {
      /* fall through to fresh generation */
    }
    setWeekPlan(suggestWeek(recipes, weekStart, lang, true));
    setHydrated(true);
    // Only run once on mount — regeneration afterwards is via explicit user actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage whenever the plan changes.
  useEffect(() => {
    if (!hydrated || weekPlan.length === 0) return;
    const weekStart = getWeekStart(new Date());
    const state: StoredState = {
      weekStartISO: weekStart.toISOString(),
      familySize,
      fastingEnabled,
      days: toStoredDays(weekPlan),
      shoppingList,
      checkedItems,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage unavailable — plan just won't survive a refresh */
    }
  }, [hydrated, weekPlan, familySize, fastingEnabled, shoppingList, checkedItems]);

  const regenerateWeek = useCallback(
    (fastingOverride?: boolean) => {
      const weekStart = getWeekStart(new Date());
      setWeekPlan(suggestWeek(recipes, weekStart, lang, fastingOverride ?? fastingEnabled));
      setShoppingList(null);
      setCheckedItems({});
    },
    [recipes, lang, fastingEnabled]
  );

  function handleToggleFasting() {
    const next = !fastingEnabled;
    setFastingEnabled(next);
    regenerateWeek(next);
  }

  function handleReroll(index: number) {
    const day = weekPlan[index];
    const replacement = suggestReplacement(recipes, day.date, lang, fastingEnabled, weekPlan);
    setWeekPlan((prev) => prev.map((d, i) => (i === index ? replacement : d)));
  }

  async function handleGenerateShoppingList() {
    setGeneratingList(true);
    setListError("");
    try {
      const shortIds = weekPlan.filter((d) => d.recipe).map((d) => d.recipe!.ShortID);
      const res = await fetch("/api/meal-planner/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortIds, familySize, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build shopping list");
      setShoppingList(data.items);
      setCheckedItems({});
    } catch (err: any) {
      setListError(err.message);
    } finally {
      setGeneratingList(false);
    }
  }

  async function handleEmailPlan(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("sending");
    setEmailError("");
    try {
      const res = await fetch("/api/meal-planner/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          alsoSubscribe,
          lang,
          days: weekPlan.map((d, i) => ({ dayIndex: i, recipeShortId: d.recipe?.ShortID ?? null, isFasting: d.isFasting })),
          shoppingList,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setEmailStatus("sent");
    } catch (err: any) {
      setEmailError(err.message);
      setEmailStatus("error");
    }
  }

  const inp = "px-3 py-2 rounded-lg border border-[#d9b08c] bg-white text-[#3e2c18] text-sm focus:outline-none focus:ring-2 focus:ring-[#a06b45] transition";

  async function handleUnlockGate(e: React.FormEvent) {
    e.preventDefault();
    setCheckingGate(true);
    setGateError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: gatePassword }),
      });
      if (res.ok) {
        setUnlocked(true);
      } else {
        setGateError("Wrong password.");
        setGatePassword("");
      }
    } catch {
      setGateError("Could not reach server. Try again.");
    } finally {
      setCheckingGate(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f4ede4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#d9b08c] p-8 shadow-sm w-full max-w-sm">
          <div className="text-4xl mb-4 text-center">🚧</div>
          <h1 className="text-2xl font-bold text-[#3e2c18] mb-1 text-center">
            {lang === "gr" ? "Έρχεται σύντομα" : "Coming soon"}
          </h1>
          <p className="text-sm text-[#5c4321] mb-6 text-center">
            {lang === "gr" ? "Αυτή η σελίδα είναι ακόμα υπό κατασκευή." : "This page is still being worked on."}
          </p>
          {gateError && <p className="text-red-600 text-sm mb-4 text-center font-medium">{gateError}</p>}
          <form onSubmit={handleUnlockGate} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value)}
              placeholder="Password"
              className={`${inp} w-full`}
            />
            <button
              type="submit"
              disabled={checkingGate}
              className="w-full py-3 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {checkingGate ? "Checking…" : "Enter →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const dayNames = DAY_NAMES[lang];

  const groupedShopping: Record<string, ShoppingItem[]> = {};
  for (const item of shoppingList ?? []) {
    (groupedShopping[item.category] ??= []).push(item);
  }

  return (
    <div className="min-h-screen bg-[#f4ede4] pt-28 lg:pt-32 pb-24 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2c18] mb-3">
            {lang === "gr" ? "Προτάσεις Εβδομάδας" : "Weekly Suggestions"}
          </h1>
          <p className="text-[#5c4321] max-w-xl mx-auto">
            {lang === "gr"
              ? "Προτάσεις για κάθε μέρα, βασισμένες στην εποχή και τη νηστεία. Άλλαξε ό,τι δεν σου αρέσει."
              : "A suggestion for every day, based on season and fasting days. Swap anything you're not in the mood for."}
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10 bg-white rounded-2xl border border-[#d9b08c] p-5 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3e2c18]">
            {lang === "gr" ? "Μέλη οικογένειας" : "Family size"}
            <input
              type="number"
              min={1}
              max={20}
              value={familySize}
              onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value) || 1))}
              className={`${inp} w-20`}
            />
          </label>

          <button
            type="button"
            onClick={handleToggleFasting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              fastingEnabled
                ? "bg-[#8c5e3c] text-white border-[#8c5e3c]"
                : "bg-white text-[#5c4321] border-[#d9b08c]"
            }`}
          >
            {fastingEnabled ? "✅" : "⬜"} {lang === "gr" ? "Σεβασμός νηστείας" : "Respect fasting days"}
          </button>

          <button
            type="button"
            onClick={() => regenerateWeek()}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-[#8c5e3c] text-[#8c5e3c] hover:bg-[#8c5e3c]/10 transition-colors"
          >
            🔄 {lang === "gr" ? "Νέα εβδομάδα" : "Regenerate week"}
          </button>
        </div>

        {/* DAYS GRID */}
        {!hydrated ? (
          <p className="text-center text-[#5c4321]">{lang === "gr" ? "Φόρτωση…" : "Loading…"}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {weekPlan.map((day, i) => {
              const r = day.recipe;
              const title = r ? (lang === "gr" ? r.TitleGR : r.TitleEN) : "";
              const category = r ? (lang === "gr" ? r.CategoryGR : r.CategoryEN) : "";
              return (
                <div key={i} className="bg-white rounded-2xl border border-[#d9b08c] shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 pt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#3e2c18]">{dayNames[i]}</span>
                    {day.isFasting && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        🕊️ {lang === "gr" ? "Νηστίσιμο" : "Fasting"}
                      </span>
                    )}
                  </div>

                  {r ? (
                    <Link href={`/recipes/${r.ShortID}`} className="group mt-3">
                      <div className="w-full aspect-video overflow-hidden">
                        <img
                          src={getThumb(r.Image, r.LinkYT)}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 pb-2">
                        <span className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-semibold rounded-full bg-[#a06b45] text-white uppercase tracking-wide">
                          {stripAccents(category)}
                        </span>
                        <h3 className="font-bold text-sm leading-snug text-[#3e2c18]">{title}</h3>
                        {cardMeta(r, lang) && <p className="mt-1 text-xs text-[#5c4321] opacity-60">{cardMeta(r, lang)}</p>}
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 text-sm text-[#5c4321]">{lang === "gr" ? "Δεν βρέθηκε συνταγή." : "No recipe found."}</div>
                  )}

                  <div className="mt-auto p-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReroll(i)}
                      className="text-xs font-semibold text-[#a06b45] hover:underline"
                    >
                      🔀 {lang === "gr" ? "Άλλη πρόταση" : "Pick another"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOPPING LIST */}
        <div className="bg-white rounded-2xl border border-[#d9b08c] shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#3e2c18]">{lang === "gr" ? "Λίστα για ψώνια" : "Shopping list"}</h2>
            <button
              type="button"
              onClick={handleGenerateShoppingList}
              disabled={generatingList || weekPlan.every((d) => !d.recipe)}
              className="px-5 py-2.5 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {generatingList ? (lang === "gr" ? "Δημιουργία…" : "Building…") : `🛒 ${lang === "gr" ? "Δημιουργία λίστας" : "Generate shopping list"}`}
            </button>
          </div>

          {listError && <p className="text-sm text-red-600 mb-4">{listError}</p>}

          {shoppingList && shoppingList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {Object.entries(groupedShopping).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-xs font-bold text-[#a06b45] uppercase tracking-widest mb-2">
                    {CATEGORY_LABEL[cat]?.[lang] ?? cat}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item, idx) => {
                      const key = `${cat}:${item.name}:${idx}`;
                      return (
                        <label key={key} className="flex items-start gap-2 text-sm text-[#3e2c18] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!checkedItems[key]}
                            onChange={(e) => setCheckedItems((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="mt-0.5"
                          />
                          <span className={checkedItems[key] ? "line-through opacity-40" : ""}>
                            {item.name} — {item.quantity}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5c4321]">
              {lang === "gr"
                ? "Δημιούργησε τη λίστα για να δεις τα υλικά όλης της εβδομάδας, συνδυασμένα σε μία λίστα."
                : "Generate the list to see this week's ingredients combined into one list."}
            </p>
          )}

          {shoppingList && shoppingList.length > 0 && (
            <form onSubmit={handleEmailPlan} className="mt-8 pt-6 border-t border-[#f0e2d0]">
              {emailStatus === "sent" ? (
                <p className="text-sm font-semibold text-[#8c5e3c]">
                  ✅ {lang === "gr" ? "Στάλθηκε! Έλεγξε τα εισερχόμενά σου." : "Sent! Check your inbox."}
                </p>
              ) : (
                <>
                  <label className="block text-[11px] font-bold text-[#5c4321] uppercase tracking-widest mb-2">
                    ✉️ {lang === "gr" ? "Στείλε το πρόγραμμα στο email σου" : "Email me this plan"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={lang === "gr" ? "Το email σου" : "Your email"}
                      className={`${inp} flex-1`}
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === "sending"}
                      className="px-5 py-2.5 bg-[#8c5e3c] hover:bg-[#a06b45] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
                    >
                      {emailStatus === "sending" ? (lang === "gr" ? "Αποστολή…" : "Sending…") : lang === "gr" ? "Αποστολή" : "Send"}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-xs text-[#5c4321]">
                    <input type="checkbox" checked={alsoSubscribe} onChange={(e) => setAlsoSubscribe(e.target.checked)} />
                    {lang === "gr" ? "Θέλω επίσης email για κάθε νέα συνταγή" : "Also email me about new recipes"}
                  </label>
                  {emailStatus === "error" && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
