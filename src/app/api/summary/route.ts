import { NextResponse } from "next/server";
import { generateDietFeedback } from "@/lib/ai";
import { requireUserId } from "@/lib/auth-guard";
import {
  calculateTargets,
  compareNutrition,
  healthWarnings,
  sumMealItems,
} from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const [profile, meals] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: auth.userId } }),
    prisma.meal.findMany({
      where: { userId: auth.userId, dateKey },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({
      profile: null,
      meals,
      targets: null,
      totals: null,
      comparisons: [],
      warnings: [],
      feedback: null,
    });
  }

  const targets = calculateTargets(profile);
  const totals = sumMealItems(meals.flatMap((meal) => meal.items));
  const comparisons = compareNutrition(targets, totals);
  const warnings = healthWarnings(profile);
  const feedback =
    meals.length > 0
      ? await generateDietFeedback({
          profile,
          targets,
          totals,
          comparisons,
          warnings,
        })
      : {
          source: "rule",
          model: "기록 대기",
          text: "아직 저장된 식사가 없습니다. 첫 식사를 기록하면 목표 칼로리와 탄단지 기준으로 피드백을 제공할게요.",
        };

  return NextResponse.json({
    profile,
    meals,
    targets,
    totals,
    comparisons,
    warnings,
    feedback,
  });
}
