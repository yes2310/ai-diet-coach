import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUserId();

  if ("error" in auth) {
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
