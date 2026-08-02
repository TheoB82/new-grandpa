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
    titleEN: { type: "string" },
    shortDescEN: { type: "string" },
    longDescEN: { type: "string" },
    ingredientsEN: { type: "array", items: { type: "string" } },
    stepsEN: { type: "array", items: { type: "string" } },
    tagsEN: { type: "array", items: { type: "string" } },
  },
  required: ["titleEN", "shortDescEN", "longDescEN", "ingredientsEN", "stepsEN", "tagsEN"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You translate Greek recipe content into natural, appetizing English for a home cooking website.

Rules:
- Keep the tone warm and home-style, not overly formal or robotic.
- Translate each ingredient/step line individually — one input line produces exactly one output line, in the same order. Never merge or split lines.
- Ingredient quantities and units should read naturally to an English-speaking home cook (e.g. "1 φλιτζάνι" -> "1 cup", "2 κ.σ." -> "2 tbsp").
- If a field is empty, return it empty in the same shape (empty string or empty array).
- Output only the structured fields. No commentary.`;

export async function POST(req: NextRequest) {
  try {
    const { password, titleGR, shortDescGR, longDescGR, ingredientsGR, stepsGR, tagsGR } = await req.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!titleGR && !shortDescGR && !(ingredientsGR?.length) && !(stepsGR?.length)) {
      return NextResponse.json({ error: "Nothing to translate — fill in the Greek fields first" }, { status: 400 });
    }

    const userPrompt = JSON.stringify({
      titleGR: titleGR || "",
      shortDescGR: shortDescGR || "",
      longDescGR: longDescGR || "",
      ingredientsGR: ingredientsGR || [],
      stepsGR: stepsGR || [],
      tagsGR: tagsGR || [],
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response from translator");
    const result = JSON.parse(textBlock.text);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Translation failed" }, { status: 500 });
  }
}
