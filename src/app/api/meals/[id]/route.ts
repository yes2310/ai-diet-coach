import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { mealInputSchema } from "@/lib/validations";
import { normalizeMealItems } from "../route";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Params) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = mealInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "식사 기록을 확인하세요." },
      { status: 400 },
    );
  }

  const existing = await prisma.meal.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "식사 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const items = await normalizeMealItems(parsed.data.items);

  const meal = await prisma.$transaction(async (tx) => {
    await tx.mealItem.deleteMany({ where: { mealId: id } });

    return tx.meal.update({
      where: { id },
      data: {
        dateKey: parsed.data.dateKey,
        mealType: parsed.data.mealType,
        note: parsed.data.note ?? null,
        items: { create: items },
      },
      include: { items: true },
    });
  });

  return NextResponse.json({ meal });
}

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const existing = await prisma.meal.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "식사 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.meal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
