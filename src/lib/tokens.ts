import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(email: string) {
  const normalizedEmail = email.toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      tokenHash,
      expires,
    },
  });

  return token;
}
