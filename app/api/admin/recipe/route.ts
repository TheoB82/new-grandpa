import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/utils/supabaseServerClient";

export const runtime = "nodejs";

function checkPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

function generateShortID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function revalidateRecipePaths(shortId?: string, categoryPaths: string[] = []) {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (shortId) revalidatePath(`/recipes/${shortId}`);
  for (const path of categoryPaths) revalidatePath(`/recipes/category/${path}`);
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

    revalidateRecipePaths(short_id);
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

    const { error } = await supabaseAdmin.from("recipes").update(recipe).eq("short_id", shortId);
    if (error) throw new Error(error.message);

    revalidateRecipePaths(shortId);
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

    const { error } = await supabaseAdmin.from("recipes").delete().eq("short_id", shortId);
    if (error) throw new Error(error.message);

    revalidateRecipePaths(shortId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}
