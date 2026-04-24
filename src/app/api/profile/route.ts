import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { calculateTargets, healthWarnings } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: auth.userId },
  });

  return NextResponse.json({
    profile,
    targets: profile ? calculateTargets(profile) : null,
    warnings: profile ? healthWarnings(profile) : [],
  });
}

export async function PUT(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "프로필 입력값을 확인하세요." },
      { status: 400 },
    );
  }

  const profile = await prisma.profile.upsert({
    where: { userId: auth.userId },
    update: parsed.data,
    create: {
      ...parsed.data,
      userId: auth.userId,
    },
  });

  return NextResponse.json({
    profile,
    targets: calculateTargets(profile),
    warnings: healthWarnings(profile),
  });
}
