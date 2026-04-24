import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isEmailVerified?: boolean;
  }
}
