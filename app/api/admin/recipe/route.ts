import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/utils/supabaseServerClient";
import { categoryMapping } from "@/utils/categoryMapping";

export const runtime = "nodejs";

function checkPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

function generateShortID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Pages with `revalidate` set (see plan note in app/page.tsx etc.) rely on this for
// instant freshness on save — the passive ISR window is intentionally long since this
// already covers the paths that matter.
function revalidateRecipePaths(shortId?: string, categoriesEN: (string | undefined)[] = []) {
  revalidateTag("recipes", {}); // clears the unstable_cache in recipesData.ts
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (shortId) revalidatePath(`/recipes/${shortId}`);
  const seen = new Set<string>();
  for (const categoryEN of categoriesEN) {
    const categoryPath = categoryMapping.en.find((c) => c.en === categoryEN)?.path;
    if (categoryPath && !seen.has(categoryPath)) {
      seen.add(categoryPath);
      revalidatePath(`/recipes/category/${categoryPath}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* CREATE                                                              */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const { password, recipe } = await req.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const short_id = generateShortID();
    const { error } = await supabaseAdmin.from("recipes").insert({ ...recipe, short_id });
    if (error) throw new Error(error.message);

    revalidateRecipePaths(short_id, [recipe.category_en]);
    return NextResponse.json({ success: true, shortId: short_id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* UPDATE                                                               */
/* ------------------------------------------------------------------ */
export async function PUT(req: NextRequest) {
  try {
    const { password, shortId, recipe } = await req.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!shortId) {
      return NextResponse.json({ error: "shortId is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin.from("recipes").select("category_en").eq("short_id", shortId).single();

    const { error } = await supabaseAdmin.from("recipes").update(recipe).eq("short_id", shortId);
    if (error) throw new Error(error.message);

    revalidateRecipePaths(shortId, [existing?.category_en, recipe.category_en]);
    return NextResponse.json({ success: true, shortId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE                                                               */
/* ------------------------------------------------------------------ */
export async function DELETE(req: NextRequest) {
  try {
    const { password, shortId } = await req.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!shortId) {
      return NextResponse.json({ error: "shortId is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin.from("recipes").select("category_en").eq("short_id", shortId).single();

    const { error } = await supabaseAdmin.from("recipes").delete().eq("short_id", shortId);
    if (error) throw new Error(error.message);

    revalidateRecipePaths(shortId, [existing?.category_en]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}
