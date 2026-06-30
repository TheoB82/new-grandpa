import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OWNER = "TheoB82";
const REPO  = "new-grandpa";
const FILE  = "app/data/recipes.json";
const BASE  = `https://api.github.com/repos/${OWNER}/${REPO}`;

async function gh(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${opts.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { password, recipe } = await req.json();

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: "GITHUB_TOKEN is not configured" }, { status: 500 });
    }

    // 1. Get current HEAD commit SHA + its tree SHA
    const refData    = await gh(`/git/ref/heads/main`);
    const commitSha  = refData.object.sha as string;
    const commitData = await gh(`/git/commits/${commitSha}`);
    const treeSha    = commitData.tree.sha as string;

    // 2. Get blob SHA for our file from the Contents API (no size limit on metadata)
    const contentsData = await gh(`/contents/${FILE}`);
    const blobSha      = contentsData.sha as string;

    // 3. Read the blob content (Git Blobs API works for any file size)
    const blobData = await gh(`/git/blobs/${blobSha}`);
    const rawB64   = (blobData.content as string).replace(/\n/g, "");
    const existing = JSON.parse(Buffer.from(rawB64, "base64").toString("utf-8"));

    // 4. Build updated JSON and create a new blob
    const updated    = [recipe, ...existing];
    const newContent = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");
    const newBlob    = await gh(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: newContent, encoding: "base64" }),
    });

    // 5. Create a new tree that replaces only our file
    const newTree = await gh(`/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: treeSha,
        tree: [{ path: FILE, mode: "100644", type: "blob", sha: newBlob.sha }],
      }),
    });

    // 6. Create the commit
    const newCommit = await gh(`/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Add recipe: ${recipe.TitleEN}`,
        tree: newTree.sha,
        parents: [commitSha],
      }),
    });

    // 7. Advance the branch ref
    await gh(`/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
  }
}
