import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, onboardingCompleted: true, passwordHash: true },
  });

  if (!user) redirect("/login");

  redirect(getPostAuthRedirectPath(user));
}
