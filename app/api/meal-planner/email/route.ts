import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAllRecipes } from "@/utils/recipesData";
import { supabaseAdmin } from "@/utils/supabaseServerClient";
import { buildMealPlanEmail, type MealPlanDay, type ShoppingItem } from "@/utils/mealPlanEmail";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;
const REPLY_TO = "grandpatassos@gmail.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, alsoSubscribe, lang, days, shoppingList } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: "No meal plan to send" }, { status: 400 });
    }

    const useLang: "gr" | "en" = lang === "en" ? "en" : "gr";
    const allRecipes = await getAllRecipes();

    const resolvedDays: MealPlanDay[] = days.map((d: { dayIndex: number; recipeShortId: string | null; isFasting: boolean }) => ({
      dayIndex: d.dayIndex,
      isFasting: !!d.isFasting,
      recipe: d.recipeShortId ? allRecipes.find((r) => r.ShortID === d.recipeShortId) ?? null : null,
    }));

    const items: ShoppingItem[] | null = Array.isArray(shoppingList)
      ? shoppingList.filter((it) => it && typeof it.name === "string" && typeof it.quantity === "string")
      : null;

    const { subject, html, text } = buildMealPlanEmail(resolvedDays, items, useLang);

    const cleanEmail = email.trim().toLowerCase();
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: cleanEmail,
      replyTo: REPLY_TO,
      subject,
      html,
      text,
    });
    if (sendError) throw new Error(sendError.message);

    if (alsoSubscribe) {
      // Best-effort — a duplicate (already subscribed) shouldn't fail a request whose email already sent.
      await supabaseAdmin.from("subscribers").insert({ email: cleanEmail, source: "meal-planner", lang: useLang }).select();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to send email" }, { status: 500 });
  }
}
