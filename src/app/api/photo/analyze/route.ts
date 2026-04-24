import { NextResponse } from "next/server";
import {
  createAiClient,
  extractChatText,
  foodPhotoAnalysisJsonSchema,
  getAiModel,
  parseJsonFromModelText,
} from "@/lib/ai";
import { requireUserId } from "@/lib/auth-guard";
import { foodPhotoAnalysisSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지를 업로드하세요." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
  const client = createAiClient();

  try {
    const response = await client.chat.completions.create({
      model: getAiModel(),
      messages: [
        {
          role: "system",
          content:
            "Estimate visible foods from the image. Return realistic Korean food candidates. Nutrition values must describe the estimated portion, not per 100g. If uncertain, set low confidence and ask for confirmation. Return only valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `사진 속 음식 후보, 예상 중량, 총 칼로리와 탄단지 값을 JSON으로 추정해줘. 다음 JSON Schema에 맞춰 JSON 객체만 반환해줘: ${JSON.stringify(foodPhotoAnalysisJsonSchema)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "low",
              },
            },
          ],
        },
      ],
    });
    const text = extractChatText(response.choices[0]?.message?.content);

    const parsed = foodPhotoAnalysisSchema.parse(parseJsonFromModelText(text));

    return NextResponse.json({
      source: "chatmock",
      analysis: parsed,
    });
  } catch (error) {
    console.error("[photo analysis error]", error);
    return NextResponse.json({
      source: "fallback",
      analysis: {
        candidates: [
          {
            name: "음식 후보",
            estimatedGrams: 100,
            confidence: 0.25,
            calories: 150,
            carbs: 20,
            protein: 8,
            fat: 4,
            note: "ChatMock 서버에 연결하지 못해 예시 후보를 표시합니다. 실제 사용 전 직접 수정하세요.",
          },
        ],
        needsUserConfirmation: true,
        question: "음식명과 실제 중량을 확인해 주세요.",
      },
    });
  }
}
