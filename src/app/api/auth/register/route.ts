import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonRequest } from "@/lib/request-json";
import { withApiLogging } from "@/lib/request-log";
import { registerSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function postHandler(request: Request) {
  const body = await readJsonRequest(request);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true, email });
}

export const POST = withApiLogging(postHandler);
