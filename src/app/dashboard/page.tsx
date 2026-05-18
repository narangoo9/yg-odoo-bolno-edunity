import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, onboardingCompleted: true },
  });

  if (!user) redirect("/login");
  if (user.status === "PENDING_VERIFICATION") redirect("/verify-email");
  if (user.role === "STUDENT" && !user.onboardingCompleted) {
    redirect("/onboarding/welcome");
  }

  redirect(getDashboardHomeByRole(user.role));
}
