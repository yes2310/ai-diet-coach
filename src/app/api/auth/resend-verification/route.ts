import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/tokens";
import { loginSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.pick({ email: true }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "올바른 이메일을 입력하세요." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const token = await createEmailVerificationToken(user.email);
  await sendVerificationEmail({ to: user.email, token });

  return NextResponse.json({ ok: true });
}
