import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/tokens";
import { registerSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser?.emailVerified) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { name, passwordHash },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });
  }

  const token = await createEmailVerificationToken(email);
  await sendVerificationEmail({ to: email, token });

  return NextResponse.json({ ok: true, email });
}
