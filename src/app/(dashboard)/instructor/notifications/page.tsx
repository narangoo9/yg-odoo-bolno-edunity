import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardHomeByRole } from "@/lib/dashboard-routes";
import { NotificationsPageContent } from "@/components/dashboard/NotificationsPageContent";

export const metadata: Metadata = { title: "Мэдэгдэл" };

export default async function InstructorNotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "INSTRUCTOR") {
    redirect(dashboardHomeByRole[session.user.role]);
  }

  return <NotificationsPageContent userId={session.user.id} />;
}
