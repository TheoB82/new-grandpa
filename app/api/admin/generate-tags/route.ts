import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

function checkPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

const client = new Anthropic();

const SCHEMA = {
  type: "object",
  properties: {
    tagsGR: { type: "array", items: { type: "string" } },
    tagsEN: { type: "array", items: { type: "string" } },
  },
  required: ["tagsGR", "tagsEN"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a tag generator for a Greek home cooking website. Given recipe details, produce 6–10 concise tags in both Greek and English.

Rules:
- Tags should cover: dish type, main ingredients, cooking method, occasion, dietary properties, cuisine style.
- Greek tags: modern Greek script with correct accents (e.g. "Γλυκό", "Θαλασσινά"). Capitalise the first letter of each tag.
- English tags: capitalise the first letter of each tag (e.g. "Seafood", "Quick dinner").
- Keep each tag short (1–3 words). No generic tags like "Recipe" or "Food". No duplicates.
- Output only the two arrays — no explanations.`;

export async function POST(req: NextRequest) {
  try {
    const { password, title, categoryGR, categoryEN, ingredientsGR, ingredientsEN, stepsGR, stepsEN } =
      await req.json();

    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!title && !(ingredientsGR?.length) && !(ingredientsEN?.length)) {
      return NextResponse.json(
        { error: "Add a title or ingredients before generating tags" },
        { status: 400 }
      );
    }

    const userPrompt = JSON.stringify({
      title: title || "",
      categoryGR: categoryGR || "",
      categoryEN: categoryEN || "",
      ingredientsGR: ingredientsGR || [],
      ingredientsEN: ingredientsEN || [],
      stepsGR: stepsGR || [],
      stepsEN: stepsEN || [],
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response from tag generator");
    const result = JSON.parse(textBlock.text);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Tag generation failed" }, { status: 500 });
  }
}
