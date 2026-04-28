import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  redirect(getDashboardHomeByRole(session.user.role));
}
