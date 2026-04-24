import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { calculateFoodAmount } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { mealInputSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const meals = await prisma.meal.findMany({
    where: { userId: auth.userId, dateKey },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = mealInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "식사 기록을 확인하세요." },
      { status: 400 },
    );
  }

  const items = await normalizeMealItems(parsed.data.items);

  const meal = await prisma.meal.create({
    data: {
      userId: auth.userId,
      dateKey: parsed.data.dateKey,
      mealType: parsed.data.mealType,
      note: parsed.data.note ?? null,
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json({ meal }, { status: 201 });
}

export async function normalizeMealItems(
  items: typeof mealInputSchema._output.items,
) {
  return Promise.all(
    items.map(async (item) => {
      if (item.foodItemId) {
        const food = await prisma.foodItem.findUnique({
          where: { id: item.foodItemId },
        });

        if (!food) {
          throw new Error("음식 정보를 찾을 수 없습니다.");
        }

        return {
          foodItemId: food.id,
          foodName: food.name,
          amountGrams: item.amountGrams,
          ...calculateFoodAmount({
            amountGrams: item.amountGrams,
            servingGrams: food.servingGrams,
            calories: food.calories,
            carbs: food.carbs,
            protein: food.protein,
            fat: food.fat,
            sodiumMg: food.sodiumMg,
            sugar: food.sugar,
            fiber: food.fiber,
          }),
        };
      }

      return {
        foodItemId: null,
        foodName: item.foodName,
        amountGrams: item.amountGrams,
        calories: item.calories ?? 0,
        carbs: item.carbs ?? 0,
        protein: item.protein ?? 0,
        fat: item.fat ?? 0,
        sodiumMg: item.sodiumMg ?? 0,
        sugar: item.sugar ?? 0,
        fiber: item.fiber ?? 0,
      };
    }),
  );
}
