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
    const response = await client.responses.create({
      model: getAiModel(),
      input: [
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
      text: {
        verbosity: "low",
      },
      max_output_tokens: 450,
    });

    return {
      source: "chatmock",
      text: response.output_text.trim(),
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
