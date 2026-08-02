import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/utils/supabaseServerClient";
import { mapRecipeRow, type RecipeRow } from "@/utils/mapRecipeRow";
import { buildNewRecipeEmail } from "@/utils/newRecipeEmail";

export const runtime = "nodejs";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;
const REPLY_TO = "grandpatassos@gmail.com";
const SITE_URL = "https://www.grandpatassos.com";

function athensToday(): string {
  // en-CA formats as YYYY-MM-DD, matching Postgres `date` columns directly.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date());
}

async function withConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runOne));
  return results;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = athensToday();

  const { data: dueRows, error: dueError } = await supabaseAdmin
    .from("recipes")
    .select("*")
    .eq("recipe_date", today)
    .is("notified_at", null);
  if (dueError) {
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  const dueRecipes = (dueRows as RecipeRow[]).map(mapRecipeRow);
  if (dueRecipes.length === 0) {
    return NextResponse.json({ success: true, date: today, recipesNotified: 0, emailsSent: 0 });
  }

  const { data: subscriberRows, error: subError } = await supabaseAdmin
    .from("subscribers")
    .select("id, email, lang")
    .is("unsubscribed_at", null);
  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  const summary: { shortId: string; title: string; sent: number; failed: number }[] = [];

  for (const recipe of dueRecipes) {
    let sent = 0;
    let failed = 0;

    await withConcurrency(subscriberRows, 5, async (sub) => {
      const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?id=${sub.id}`;
      const lang: "gr" | "en" = sub.lang === "en" ? "en" : "gr";
      const { subject, html, text } = buildNewRecipeEmail(recipe, unsubscribeUrl, lang);
      const { error } = await resend.emails.send({
        from: FROM,
        to: sub.email,
        replyTo: REPLY_TO,
        subject,
        html,
        text,
      });
      if (error) failed++;
      else sent++;
    });

    await supabaseAdmin
      .from("recipes")
      .update({ notified_at: new Date().toISOString() })
      .eq("short_id", recipe.ShortID);

    summary.push({ shortId: recipe.ShortID, title: recipe.TitleGR, sent, failed });
  }

  return NextResponse.json({
    success: true,
    date: today,
    recipesNotified: dueRecipes.length,
    subscriberCount: subscriberRows.length,
    results: summary,
  });
}
