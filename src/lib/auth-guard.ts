import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!session.user.isEmailVerified) {
    return { error: Response.json({ error: "Email is not verified" }, { status: 403 }) };
  }

  return { userId: session.user.id, session };
}
