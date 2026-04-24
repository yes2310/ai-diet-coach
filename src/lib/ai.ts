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
  if (input.totals.calories <= 0) {
    return {
      source: "rule",
      model: "기록 대기",
      text: "아직 저장된 식사가 없습니다. 첫 식사를 기록하면 목표 칼로리와 탄단지 기준으로 피드백을 제공할게요.",
    };
  }

  try {
    const client = createAiClient();
    const response = await client.chat.completions.create({
      model: getAiModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a Korean nutrition coaching assistant. Do not diagnose, treat, or prescribe. Return only a compact JSON object with this shape: {\"summary\":\"one natural Korean sentence\", \"actions\":[\"short action 1\", \"short action 2\", \"short action 3\"]}. Do not use markdown, headings, bullet symbols, backticks, or code formatting.",
        },
        {
          role: "user",
          content: `다음 식사 기록을 바탕으로 사용자가 바로 실행할 수 있는 짧은 피드백을 한국어로 작성해줘. 총 4문장 이하로 유지해줘.\n${JSON.stringify(input)}`,
        },
      ],
    });
    const text = extractChatText(response.choices[0]?.message?.content);

    if (!text) {
      throw new Error("ChatMock returned an empty feedback response.");
    }

    return {
      source: "chatmock",
      model: getAiModel(),
      text: normalizeFeedbackText(text),
    };
  } catch (error) {
    console.error("[chatmock feedback error]", error);
    return {
      source: "rule",
      model: "규칙 기반",
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

export function normalizeFeedbackText(text: string) {
  try {
    const parsed = parseJsonFromModelText(text) as {
      summary?: unknown;
      actions?: unknown;
    };
    const lines = [
      typeof parsed.summary === "string" ? parsed.summary : "",
      ...(Array.isArray(parsed.actions)
        ? parsed.actions.filter((item): item is string => typeof item === "string")
        : []),
    ].filter(Boolean);

    if (lines.length) {
      return lines.join("\n");
    }
  } catch {
    // Fall through to plain-text cleanup for non-JSON responses.
  }

  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("\n");
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
