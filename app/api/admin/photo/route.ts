import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/utils/supabaseServerClient";

export const runtime = "nodejs";

function checkPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const password = String(form.get("password") ?? "");
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${randomUUID()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("recipe-photos")
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);

    const { data } = supabaseAdmin.storage.from("recipe-photos").getPublicUrl(path);
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}
