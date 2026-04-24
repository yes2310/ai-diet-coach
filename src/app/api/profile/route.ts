import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { calculateTargets, healthWarnings } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { withApiLogging } from "@/lib/request-log";
import { profileSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function getHandler() {
  const auth = await requireUserId();

  if (!auth.ok) {
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

async function putHandler(request: Request) {
  const auth = await requireUserId();

  if (!auth.ok) {
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

export const GET = withApiLogging(getHandler);
export const PUT = withApiLogging(putHandler);
