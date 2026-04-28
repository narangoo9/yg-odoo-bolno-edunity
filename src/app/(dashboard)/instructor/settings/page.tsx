import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { DangerZone } from "@/components/forms/DangerZone";
import { User, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function InstructorSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, avatarUrl: true,
      bio: true, role: true, createdAt: true, emailVerified: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Тохиргоо</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Профайл болон дансны тохиргоо</p>
      </div>

      <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <User size={15} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="font-bold text-foreground">Багшийн профайл</h2>
        </div>
        <ProfileForm
          user={{
            id: user.id, name: user.name, email: user.email,
            avatarUrl: user.avatarUrl, bio: user.bio,
          }}
        />
      </section>

      <section className="bg-card rounded-2xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-red-100 dark:border-red-900/20">
          <div className="w-8 h-8 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={15} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="font-bold text-red-900 dark:text-red-400">Анхаарах бүс</h2>
        </div>
        <DangerZone />
      </section>
    </div>
  );
}
