import "server-only";
import type { Recipe } from "@/types/recipe";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

const SITE_URL = "https://www.grandpatassos.com";

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

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

function recipeImage(recipe: Recipe): string {
  if (recipe.Image) return recipe.Image;
  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  return videoID
    ? `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`
    : `${SITE_URL}/placeholder.jpg`;
}

export type MealPlanDay = { dayIndex: number; recipe: Recipe | null; isFasting: boolean };
export type ShoppingItem = { name: string; quantity: string; category: string };

const COPY = {
  gr: {
    eyebrow: "Ο παππούς ο Τάσος μαγειρεύει",
    title: "Το εβδομαδιαίο πρόγραμμα γευμάτων σου",
    fastingBadge: "Νηστίσιμο",
    shoppingHeading: "Λίστα για ψώνια",
    subject: "Το εβδομαδιαίο πρόγραμμα γευμάτων σου",
  },
  en: {
    eyebrow: "Grandpa Tassos Cooking",
    title: "Your weekly meal plan",
    fastingBadge: "Fasting day",
    shoppingHeading: "Shopping list",
    subject: "Your weekly meal plan",
  },
};

export function buildMealPlanEmail(
  days: MealPlanDay[],
  shoppingList: ShoppingItem[] | null,
  lang: "gr" | "en" = "gr"
): { subject: string; html: string; text: string } {
  const c = COPY[lang];
  const dayNames = DAY_NAMES[lang];

  const dayRows = days
    .map((d) => {
      const dayName = dayNames[d.dayIndex] ?? "";
      if (!d.recipe) {
        return `<tr><td style="padding:10px 0;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;font-size:14px;">${dayName}: —</td></tr>`;
      }
      const title = lang === "gr" ? d.recipe.TitleGR : d.recipe.TitleEN;
      const url = `${SITE_URL}/recipes/${d.recipe.ShortID}`;
      const img = recipeImage(d.recipe);
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(140,94,60,0.2);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="64" style="vertical-align:top;">
                  <img src="${img}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;" />
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <div style="color:#fdd9a1;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
                    ${stripAccents(dayName)}${d.isFasting ? ` · ${stripAccents(c.fastingBadge)}` : ""}
                  </div>
                  <a href="${url}" style="color:#ffffff;font-family:Georgia,serif;font-size:16px;font-weight:bold;text-decoration:none;">${title}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  const groupedShopping: Record<string, ShoppingItem[]> = {};
  for (const item of shoppingList ?? []) {
    (groupedShopping[item.category] ??= []).push(item);
  }

  const shoppingHtml = shoppingList && shoppingList.length > 0
    ? `
      <tr>
        <td style="padding:28px 32px 0;">
          <div style="color:#fdd9a1;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">${stripAccents(c.shoppingHeading)}</div>
          ${Object.entries(groupedShopping)
            .map(
              ([cat, items]) => `
            <div style="margin-bottom:14px;">
              <div style="color:rgba(253,217,161,0.7);font-family:Arial,sans-serif;font-size:11px;font-weight:bold;text-transform:uppercase;margin-bottom:4px;">${CATEGORY_LABEL[cat]?.[lang] ?? cat}</div>
              ${items.map((it) => `<div style="color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-size:14px;padding:2px 0;">☐ ${it.name} — ${it.quantity}</div>`).join("")}
            </div>`
            )
            .join("")}
        </td>
      </tr>`
    : "";

  const html = `<!doctype html>
<html lang="${lang === "gr" ? "el" : "en"}">
  <body style="margin:0;padding:0;background-color:#f4ede4;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4ede4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#3c2718;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 4px;text-align:center;">
                <span style="color:#fdd9a1;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${stripAccents(c.eyebrow)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 20px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;font-weight:bold;">${c.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${dayRows}
                </table>
              </td>
            </tr>
            ${shoppingHtml}
            <tr>
              <td style="padding:28px 32px 28px;text-align:center;">
                <a href="${SITE_URL}" style="display:inline-block;background-color:#8c5e3c;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:999px;">grandpatassos.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    c.title,
    "",
    ...days.map((d) => {
      const dayName = dayNames[d.dayIndex] ?? "";
      if (!d.recipe) return `${dayName}: —`;
      const title = lang === "gr" ? d.recipe.TitleGR : d.recipe.TitleEN;
      return `${dayName}: ${title} — ${SITE_URL}/recipes/${d.recipe.ShortID}`;
    }),
    ...(shoppingList && shoppingList.length > 0
      ? ["", c.shoppingHeading + ":", ...shoppingList.map((it) => `- ${it.name} — ${it.quantity}`)]
      : []),
  ].join("\n");

  return { subject: c.subject, html, text };
}
