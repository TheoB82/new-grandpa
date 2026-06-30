import { NextRequest, NextResponse } from "next/server";

const OWNER = "TheoB82";
const REPO  = "new-grandpa";
const PATH  = "app/data/recipes.json";
const API   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

export async function POST(req: NextRequest) {
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

  // Read current file + its SHA (required for the update commit)
  const fileRes = await fetch(API, { headers });
  if (!fileRes.ok) {
    return NextResponse.json({ error: "Could not read recipes.json from GitHub" }, { status: 502 });
  }
  const fileData = await fileRes.json();
  const sha      = fileData.sha as string;
  const existing = JSON.parse(Buffer.from(fileData.content as string, "base64").toString("utf-8"));

  // Prepend new recipe so it appears first (we sort by date anyway)
  const updated = [recipe, ...existing];
  const encoded = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");

  // Commit back to main
  const commitRes = await fetch(API, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Add recipe: ${recipe.TitleEN}`,
      content: encoded,
      sha,
      branch: "main",
    }),
  });

  if (!commitRes.ok) {
    const err = await commitRes.json();
    return NextResponse.json({ error: err.message || "Commit failed" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
