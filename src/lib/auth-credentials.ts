import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { LoginFailureReason } from "./auth-feedback";
import { loginSchema } from "./validations";

export type CredentialsUser = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
};

export type CredentialsCheckResult =
  | {
      readonly status: "ok";
      readonly user: CredentialsUser;
    }
  | {
      readonly status: LoginFailureReason;
    };

export async function verifyLoginCredentials(
  credentials: unknown,
): Promise<CredentialsCheckResult> {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return { status: "invalid-input" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user?.passwordHash) {
    return { status: "unknown-email" };
  }

  const passwordMatches = await compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return { status: "wrong-password" };
  }

  return {
    status: "ok",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}
