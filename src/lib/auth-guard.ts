import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, userId: session.user.id, session };
}
