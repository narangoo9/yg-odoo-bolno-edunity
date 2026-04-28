import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UpgradeClient } from "@/components/student/UpgradeClient";

export const metadata: Metadata = { title: "Upgrade — EduNity" };

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true, currentPeriodEnd: true },
  });

  return <UpgradeClient currentPlan={subscription?.plan ?? "FREE"} />;
}
