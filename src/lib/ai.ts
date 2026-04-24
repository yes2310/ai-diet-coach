import OpenAI from "openai";
import type { NutrientComparison, NutritionTargets, NutritionTotals } from "@/lib/nutrition";
import { createRuleBasedFeedback } from "@/lib/nutrition";

type FeedbackInput = {
  profile: {
    goal: string;
    allergies: string[];
    conditions: string[];
    preferredFoods: string[];
    dislikedFoods: string[];
  };
  targets: NutritionTargets;
  totals: NutritionTotals;
  comparisons: NutrientComparison[];
  warnings: string[];
};

export async function generateDietFeedback(input: FeedbackInput) {
  try {
    const client = createAiClient();
    const response = await client.chat.completions.create({
      model: getAiModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a Korean nutrition coaching assistant. Give practical food logging feedback. Do not diagnose, treat, or prescribe. Mention medical caution when conditions are present.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });
    const text = extractChatText(response.choices[0]?.message?.content);

    if (!text) {
      throw new Error("ChatMock returned an empty feedback response.");
    }

    return {
      source: "chatmock",
      text,
    };
  } catch (error) {
    console.error("[chatmock feedback error]", error);
    return {
      source: "rule",
      text: createRuleBasedFeedback(input.comparisons, input.profile),
    };
  }
}

export function createAiClient() {
  return new OpenAI({
    apiKey: process.env.CHATMOCK_API_KEY || process.env.OPENAI_API_KEY || "anything",
    baseURL: process.env.CHATMOCK_BASE_URL || process.env.OPENAI_BASE_URL || "http://127.0.0.1:8000/v1",
  });
}

export function getAiModel() {
  return process.env.CHATMOCK_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

export function extractChatText(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    })
    .join("")
    .trim();
}

export function parseJsonFromModelText(text: string) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }

    throw new Error("Model response did not contain JSON.");
  }
}

export const foodPhotoAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidates", "needsUserConfirmation", "question"],
  properties: {
    candidates: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "estimatedGrams",
          "confidence",
          "calories",
          "carbs",
          "protein",
          "fat",
          "note",
        ],
        properties: {
          name: { type: "string" },
          estimatedGrams: { type: "number" },
          confidence: { type: "number" },
          calories: { type: "number" },
          carbs: { type: "number" },
          protein: { type: "number" },
          fat: { type: "number" },
          note: { type: "string" },
        },
      },
    },
    needsUserConfirmation: { type: "boolean" },
    question: { type: "string" },
  },
};
