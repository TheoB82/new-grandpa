// Greek Orthodox fasting calendar — best-effort common practice, not a
// canonical/jurisdiction-exact ruling. Good enough to drive recipe
// suggestions; easy to refine later if it ever needs to be more precise.

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function atMidnightUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function isBetween(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

// Orthodox (Julian calendar) Easter date, expressed as a Gregorian date.
// Meeus's Julian algorithm for the Julian-calendar Easter date, then +13
// days to convert to the Gregorian calendar (valid for years 1900–2099,
// which comfortably covers any real use of this app).
export function getOrthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3 = March, 4 = April (Julian)
  const day = ((d + e + 114) % 31) + 1;
  return addDays(atMidnightUTC(year, month, day), 13);
}

export type FastingInfo = { isFasting: boolean; period?: string };

export function getFastingInfo(date: Date): FastingInfo {
  const day = atMidnightUTC(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const year = day.getUTCFullYear();

  const easter = getOrthodoxEaster(year);
  const easterPrevYear = getOrthodoxEaster(year - 1);
  const easterNextYear = getOrthodoxEaster(year + 1);

  // Movable: Great Lent (Clean Monday) through Holy Saturday.
  for (const e of [easterPrevYear, easter, easterNextYear]) {
    const cleanMonday = addDays(e, -48);
    const holySaturday = addDays(e, -1);
    if (isBetween(day, cleanMonday, holySaturday)) {
      return { isFasting: true, period: "Great Lent" };
    }
  }

  // Movable: Apostles' Fast — day after All Saints Sunday (Easter+57) through Jun 28.
  for (const e of [easterPrevYear, easter]) {
    const start = addDays(e, 57);
    const end = atMidnightUTC(start.getUTCFullYear(), 6, 28);
    if (start.getTime() <= end.getTime() && isBetween(day, start, end)) {
      return { isFasting: true, period: "Apostles' Fast" };
    }
  }

  // Fixed: Dormition Fast, Aug 1–15.
  if (isBetween(day, atMidnightUTC(year, 8, 1), atMidnightUTC(year, 8, 15))) {
    return { isFasting: true, period: "Dormition Fast" };
  }

  // Fixed: Nativity Fast, Nov 15–Dec 24.
  if (isBetween(day, atMidnightUTC(year, 11, 15), atMidnightUTC(year, 12, 24))) {
    return { isFasting: true, period: "Nativity Fast" };
  }

  // Fast-free periods override the weekly Wed/Fri pattern below.
  const fastFreeWindows: [Date, Date][] = [
    [atMidnightUTC(year - 1, 12, 25), atMidnightUTC(year, 1, 4)],
    [atMidnightUTC(year, 12, 25), atMidnightUTC(year + 1, 1, 4)],
    [easter, addDays(easter, 6)], // Bright Week
    [addDays(easterPrevYear, 50), addDays(easterPrevYear, 56)], // week after Pentecost
    [addDays(easter, 50), addDays(easter, 56)],
  ];
  if (fastFreeWindows.some(([start, end]) => isBetween(day, start, end))) {
    return { isFasting: false };
  }

  // Weekly: Wednesday (3) and Friday (5).
  const weekday = day.getUTCDay();
  if (weekday === 3 || weekday === 5) {
    return { isFasting: true, period: "Weekly (Wed/Fri)" };
  }

  return { isFasting: false };
}
