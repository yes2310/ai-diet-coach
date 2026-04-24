import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", url));
  }

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
    }
    return NextResponse.redirect(new URL("/verify-email?status=expired", url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.redirect(new URL("/login?verified=1", url));
}
