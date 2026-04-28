import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">Тохиргоо</h1>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">Системийн тохиргоо ба параметрүүд</p>
      </div>
      <AdminSettingsForm />
    </div>
  );
}
