import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OWNER = "TheoB82";
const REPO  = "new-grandpa";
const PATH  = "app/data/recipes.json";
const API   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

export async function POST(req: NextRequest) {
  try {
    const { password, recipe } = await req.json();

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: "GITHUB_TOKEN is not configured" }, { status: 500 });
    }

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // no-store prevents Next.js from caching the GitHub response
    const fileRes = await fetch(API, { headers, cache: "no-store" });
    if (!fileRes.ok) {
      const errBody = await fileRes.text();
      return NextResponse.json(
        { error: `GitHub read failed (${fileRes.status}): ${errBody}` },
        { status: 502 }
      );
    }

    const fileData = await fileRes.json();
    const sha = fileData.sha as string;

    if (!fileData.content) {
      return NextResponse.json(
        { error: "GitHub returned no file content — file may exceed 1 MB or token lacks read access." },
        { status: 502 }
      );
    }

    // GitHub wraps base64 at 60 chars with newlines — strip before decoding
    const rawB64   = (fileData.content as string).replace(/\n/g, "");
    const existing = JSON.parse(Buffer.from(rawB64, "base64").toString("utf-8"));

    // Prepend new recipe so it appears first
    const updated = [recipe, ...existing];
    const encoded = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");

    const commitRes = await fetch(API, {
      method: "PUT",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        message: `Add recipe: ${recipe.TitleEN}`,
        content: encoded,
        sha,
        branch: "main",
      }),
    });

    if (!commitRes.ok) {
      const errBody = await commitRes.text();
      return NextResponse.json(
        { error: `GitHub commit failed (${commitRes.status}): ${errBody}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}
