import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { withApiLogging } from "@/lib/request-log";

export const runtime = "nodejs";

async function getHandler(request: Request) {
  const auth = await requireUserId();

  if (!auth.ok) {
    return auth.error;
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const foods = await prisma.foodItem.findMany({
    where: q
      ? {
          name: {
            contains: q,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 30,
  });

  return NextResponse.json({ foods });
}

export const GET = withApiLogging(getHandler);
