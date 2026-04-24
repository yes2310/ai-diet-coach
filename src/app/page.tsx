import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardApp } from "@/components/dashboard-app";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isEmailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email ?? "")}`);
  }

  return (
    <DashboardApp
      userName={session.user.name ?? "사용자"}
      userEmail={session.user.email ?? ""}
    />
  );
}
