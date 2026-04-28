import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const metadata: Metadata = { title: "Календар" };

export default async function AdminCalendarPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">Календар</h1>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">Үйл явдал ба цагийн хуваарь</p>
      </div>
      <AdminCalendar />
    </div>
  );
}
