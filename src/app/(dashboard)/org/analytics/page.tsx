import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award, BarChart3, BookOpen, GraduationCap, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Байгууллагын аналитик" };

export default async function OrgAnalyticsPage() {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/org");
  }

  const [courseCount, memberCount, programCount, enrollmentCount, certificateCount] = await Promise.all([
    db.course.count({ where: { organizationId: orgId } }).catch(() => 0),
    db.user.count({ where: { organizationId: orgId } }).catch(() => 0),
    db.program.count({ where: { organizationId: orgId } }).catch(() => 0),
    db.enrollment.count({ where: { course: { organizationId: orgId } } }).catch(() => 0),
    db.certificate.count({ where: { organizationId: orgId } }).catch(() => 0),
  ]);

  const stats = [
    { label: "Курсууд", value: courseCount, icon: BookOpen, className: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400" },
    { label: "Гишүүд", value: memberCount, icon: Users, className: "bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400" },
    { label: "Программууд", value: programCount, icon: GraduationCap, className: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400" },
    { label: "Бүртгэлүүд", value: enrollmentCount, icon: BarChart3, className: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    { label: "Сертификатууд", value: certificateCount, icon: Award, className: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Байгууллагын аналитик</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Байгууллагын сургалтын ерөнхий үзүүлэлтүүд</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${stat.className}`}>
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
