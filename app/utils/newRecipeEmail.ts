import "server-only";
import type { Recipe } from "@/types/recipe";
import { getYoutubeVideoID } from "@/utils/getYoutubeVideoID";

const SITE_URL = "https://www.grandpatassos.com";

// Strip diacritics before CSS text-transform:uppercase — accented Greek letters
// render with a stray accent mark when uppercased otherwise.
const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function recipeImage(recipe: Recipe): string {
  if (recipe.Image) return recipe.Image;
  const videoID = recipe.LinkYT ? getYoutubeVideoID(recipe.LinkYT) : null;
  return videoID
    ? `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`
    : `${SITE_URL}/placeholder.jpg`;
}

const COPY = {
  gr: {
    eyebrow: "Ο παππούς ο Τάσος μαγειρεύει",
    subjectPrefix: "Νέα συνταγή:",
    cta: "Δες τη συνταγή →",
    footer: "Λαμβάνεις αυτό το email επειδή έγραψες το email σου στο grandpatassos.com",
    unsubscribe: "Διαγραφή από τη λίστα",
  },
  en: {
    eyebrow: "Grandpa Tassos Cooking",
    subjectPrefix: "New recipe:",
    cta: "View the recipe →",
    footer: "You're receiving this because you signed up at grandpatassos.com",
    unsubscribe: "Unsubscribe",
  },
};

export function buildNewRecipeEmail(
  recipe: Recipe,
  unsubscribeUrl: string,
  lang: "gr" | "en" = "gr"
): { subject: string; html: string; text: string } {
  const c = COPY[lang];
  const title = lang === "gr" ? recipe.TitleGR : recipe.TitleEN;
  const desc = lang === "gr" ? recipe.ShortDescriptionGR : recipe.ShortDescriptionEN;
  const category = lang === "gr" ? recipe.CategoryGR.join(", ") : recipe.CategoryEN.join(", ");

  const recipeUrl = `${SITE_URL}/recipes/${recipe.ShortID}`;
  const image = recipeImage(recipe);
  const subject = `${c.subjectPrefix} ${title}`;

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
              <td style="padding:16px 0 0;">
                <img src="${image}" width="600" alt="${title}" style="display:block;width:100%;height:auto;max-height:340px;object-fit:cover;" />
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:rgba(140,94,60,0.25);border:1px solid rgba(140,94,60,0.4);color:#fdd9a1;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,sans-serif;">${stripAccents(category)}</span>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 0;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:bold;">${title}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 32px 0;text-align:center;">
                <p style="margin:0;color:rgba(255,255,255,0.7);font-size:16px;line-height:1.5;">${desc}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <a href="${recipeUrl}" style="display:inline-block;background-color:#8c5e3c;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:999px;">${c.cta}</a>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 24px;text-align:center;border-top:1px solid rgba(140,94,60,0.25);margin-top:24px;">
                <p style="margin:20px 0 6px;color:rgba(255,255,255,0.4);font-size:12px;font-family:Arial,sans-serif;">
                  ${c.footer}
                </p>
                <a href="${unsubscribeUrl}" style="color:rgba(253,217,161,0.7);font-size:12px;font-family:Arial,sans-serif;">${c.unsubscribe}</a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${title}\n\n${desc}\n\n${c.cta.replace(" →", "")}: ${recipeUrl}\n\n---\n${c.unsubscribe}: ${unsubscribeUrl}`;

  return { subject, html, text };
}
