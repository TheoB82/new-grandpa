import type { Recipe } from "@/types/recipe";
import { matchesCategory } from "@/utils/matchesCategory";
import { categoryMapping } from "@/utils/categoryMapping";
import { getFastingInfo } from "@/utils/orthodoxCalendar";

const LENTEN = categoryMapping.gr.find((c) => c.en === "Lenten")!;

export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(date: Date): Season {
  const month = date.getUTCMonth() + 1; // 1–12
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

export type DayPlan = {
  date: Date;
  isFasting: boolean;
  fastingPeriod?: string;
  recipe: Recipe | null;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Cascading fallback so a day is never left without a suggestion: season match
// under fasting/exclusion constraints -> drop season -> drop exclusion -> drop
// fasting (only reachable if the dataset had zero Lenten recipes, which it doesn't).
function candidatesFor(
  recipes: Recipe[],
  isFasting: boolean,
  season: Season,
  lang: "gr" | "en",
  excludeShortIds: Set<string>
): Recipe[] {
  const notExcluded = (r: Recipe) => !excludeShortIds.has(r.ShortID);
  const isLenten = (r: Recipe) => matchesCategory(r, LENTEN, lang);
  const isInSeason = (r: Recipe) => !r.Seasons || r.Seasons.length === 0 || r.Seasons.includes(season);

  let pool = recipes.filter(notExcluded);
  if (isFasting) pool = pool.filter(isLenten);

  const seasonal = pool.filter(isInSeason);
  if (seasonal.length > 0) return seasonal;
  if (pool.length > 0) return pool;

  if (isFasting) {
    const anyLenten = recipes.filter(isLenten);
    if (anyLenten.length > 0) return anyLenten;
  }

  return recipes;
}

export function suggestDay(
  recipes: Recipe[],
  date: Date,
  lang: "gr" | "en",
  fastingEnabled: boolean,
  excludeShortIds: Set<string> = new Set()
): DayPlan {
  const fasting = fastingEnabled ? getFastingInfo(date) : { isFasting: false };
  const season = getSeason(date);
  const candidates = candidatesFor(recipes, fasting.isFasting, season, lang, excludeShortIds);
  const recipe = candidates.length > 0 ? pickRandom(candidates) : null;
  return { date, isFasting: fasting.isFasting, fastingPeriod: fasting.period, recipe };
}

export function suggestWeek(
  recipes: Recipe[],
  weekStart: Date,
  lang: "gr" | "en",
  fastingEnabled: boolean
): DayPlan[] {
  const used = new Set<string>();
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + i);
    const day = suggestDay(recipes, date, lang, fastingEnabled, used);
    if (day.recipe) used.add(day.recipe.ShortID);
    days.push(day);
  }
  return days;
}

export function suggestReplacement(
  recipes: Recipe[],
  date: Date,
  lang: "gr" | "en",
  fastingEnabled: boolean,
  weekPicks: DayPlan[]
): DayPlan {
  const used = new Set(weekPicks.filter((d) => d.recipe).map((d) => d.recipe!.ShortID));
  return suggestDay(recipes, date, lang, fastingEnabled, used);
}

// Monday of the week containing `date`.
export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = weekday === 0 ? -6 : 1 - weekday;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}
