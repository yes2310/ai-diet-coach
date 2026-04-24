import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { userId: session.user.id, session };
}
