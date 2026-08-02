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
    prepTimeMinutes: { type: ["integer", "null"], description: "Active prep time before cooking starts, in minutes" },
    cookTimeMinutes: { type: ["integer", "null"], description: "Cooking/baking time, in minutes" },
    servings: { type: ["integer", "null"], description: "Number of servings/portions this recipe yields" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    caloriesPerServing: { type: ["integer", "null"], description: "Rough estimated calories per serving, based on the ingredient quantities" },
    seasons: {
      type: "array",
      items: { type: "string", enum: ["spring", "summer", "autumn", "winter"] },
      description: "Season(s) this dish is genuinely associated with, for a seasonal meal planner. Empty array if it's a genuinely any-season dish — don't force a guess.",
    },
  },
  required: ["prepTimeMinutes", "cookTimeMinutes", "servings", "difficulty", "caloriesPerServing", "seasons"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You extract structured recipe metadata (prep time, cook time, servings, difficulty, estimated calories, seasonality) from recipe text (ingredients + steps).

Rules:
- Prefer times explicitly stated in the steps over guessing.
- If prep time isn't stated anywhere, estimate it reasonably from the number and complexity of steps before cooking starts.
- Servings: infer from pan/dish size, ingredient quantities, or explicit mentions. If truly unknowable, use a reasonable default for a home-style dish (4-6).
- Difficulty: Easy (few steps, forgiving), Medium (multiple components or techniques), Hard (dough/pastry work, precise timing, many components).
- caloriesPerServing: estimate from the ingredient list and quantities using general nutrition knowledge. This is always an estimate, not a lab measurement.
- seasons: base this on the ingredients (e.g. watermelon/tomatoes/courgettes → summer; pumpkin/mushrooms → autumn; hearty stews/legume soups → autumn/winter; fresh spring greens/artichokes → spring) and dish type. A dish can belong to multiple seasons, or none — return an empty array for genuinely any-season dishes (most breads, many desserts, everyday staples) rather than forcing a guess.
- Output only the structured fields. No commentary.`;

export async function POST(req: NextRequest) {
  try {
    const { password, title, ingredients, steps } = await req.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ingredients && !steps) {
      return NextResponse.json({ error: "Nothing to estimate from — fill in ingredients or steps first" }, { status: 400 });
    }

    const userPrompt = `Recipe: ${title || ""}\n\nIngredients:\n${ingredients || ""}\n\nSteps:\n${steps || ""}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response from estimator");
    const result = JSON.parse(textBlock.text);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Auto-fill failed" }, { status: 500 });
  }
}
