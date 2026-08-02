import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAllRecipes } from "@/utils/recipesData";

export const runtime = "nodejs";

const client = new Anthropic();

function htmlToLines(html: string): string[] {
  if (!html) return [];
  const matches = [...html.matchAll(/<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)];
  const lines = matches.length ? matches.map((m) => m[1]) : [html];
  return lines
    .map((l) => l.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "string", description: "Combined, scaled, human-readable quantity, e.g. '3 cups' or '500g'. If units genuinely don't merge cleanly, list them together, e.g. '2 cups + 200g'." },
          category: { type: "string", enum: ["produce", "dairy_eggs", "meat_fish", "pantry", "bakery", "other"] },
        },
        required: ["name", "quantity", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

function systemPrompt(lang: "gr" | "en") {
  const langName = lang === "gr" ? "Greek" : "English";
  return `You build a consolidated grocery shopping list from several recipes' ingredient lists, each with a scale factor already applied to account for family size (e.g. a recipe meant for 4 people being cooked for 6 has scale factor 1.5 — apply it to that recipe's quantities before merging).

Rules:
- Merge matching ingredients across recipes into one line, summing quantities when units are compatible (e.g. "2 cups flour" from one recipe + "1 cup flour" from another, scale factors already applied → "3 cups flour").
- If units don't cleanly merge (e.g. cups vs grams for the same ingredient), combine them into one readable line anyway rather than creating duplicate entries, e.g. "2 cups + 200g".
- Treat near-duplicate ingredient names as the same item (e.g. "olive oil" / "extra virgin olive oil").
- Skip water, salt, and pepper unless a specific quantity is called out that would matter for shopping.
- Write every item name and quantity in ${langName}, regardless of the input language.
- Output only the structured items list, no commentary.`;
}

export async function POST(req: NextRequest) {
  try {
    const { shortIds, familySize, lang } = await req.json();
    if (!Array.isArray(shortIds) || shortIds.length === 0) {
      return NextResponse.json({ error: "No recipes selected" }, { status: 400 });
    }
    const useLang: "gr" | "en" = lang === "en" ? "en" : "gr";
    const desiredServings = Number(familySize) > 0 ? Number(familySize) : 4;

    const allRecipes = await getAllRecipes();
    const selected = shortIds
      .map((id: string) => allRecipes.find((r) => r.ShortID === id))
      .filter(Boolean) as (typeof allRecipes)[number][];

    if (selected.length === 0) {
      return NextResponse.json({ error: "None of the selected recipes were found" }, { status: 400 });
    }

    const recipeBlocks = selected.map((r) => {
      const title = useLang === "gr" ? r.TitleGR : r.TitleEN;
      const ingredientsHtml = useLang === "gr" ? r.IngredientsGR : r.IngredientsEN;
      const scale = r.Servings ? desiredServings / r.Servings : 1;
      const lines = htmlToLines(ingredientsHtml);
      return `Recipe: ${title} (scale factor ${scale.toFixed(2)}x)\n${lines.map((l) => `- ${l}`).join("\n")}`;
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: systemPrompt(useLang),
      messages: [{ role: "user", content: recipeBlocks.join("\n\n") }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response from shopping-list builder");
    const result = JSON.parse(textBlock.text);

    return NextResponse.json({ success: true, items: result.items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to build shopping list" }, { status: 500 });
  }
}
