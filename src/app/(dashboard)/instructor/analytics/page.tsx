import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Users, Award, Star, TrendingUp, DollarSign } from "lucide-react";
import { InstructorCharts } from "@/components/analytics/InstructorCharts";
import { getInstructorAnalytics, getInstructorCourseStats } from "@/modules/analytics/infrastructure/queries";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, subMonths, eachMonthOfInterval } from "date-fns";

export const metadata: Metadata = { title: "Аналитик" };

export default async function InstructorAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["COMPANY", "COMPANY", "SUPER_ADMIN"].includes(session.user.role)) redirect("/student");

  const instructorId = session.user.id;
  const [analytics, courseStats] = await Promise.all([
    getInstructorAnalytics(instructorId),
    getInstructorCourseStats(instructorId),
  ]);
  const courseIds = courseStats.map((c) => c.id);

  const now   = new Date();
  const start = subMonths(startOfMonth(now), 5);
  const months = eachMonthOfInterval({ start, end: now });

  const [payments, enrollments] = await Promise.all([
    courseIds.length === 0 ? Promise.resolve([]) : db.payment.findMany({
      where: { status: "COMPLETED", courseId: { in: courseIds }, createdAt: { gte: start } },
      select: { amount: true, createdAt: true },
    }),
    db.enrollment.findMany({
      where: { course: { instructorId }, enrolledAt: { gte: start } },
      select: { enrolledAt: true, status: true },
    }),
  ]);

  const monthlyData = months.map((month) => {
    const mp = payments.filter(p =>
      new Date(p.createdAt).getFullYear() === month.getFullYear() &&
      new Date(p.createdAt).getMonth() === month.getMonth()
    );
    const me = enrollments.filter(e =>
      new Date(e.enrolledAt).getFullYear() === month.getFullYear() &&
      new Date(e.enrolledAt).getMonth() === month.getMonth()
    );
    return {
      month:       month.toLocaleDateString("mn-MN", { month: "short", year: "2-digit" }),
      revenue:     mp.reduce((s, p) => s + Number(p.amount), 0),
      enrollments: me.length,
      completed:   me.filter(e => e.status === "COMPLETED").length,
    };
  });

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Аналитик</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Таны курсуудын үзүүлэлт</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Курс",      value: analytics.totalCourses,                                    icon: BookOpen,  c: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400" },
          { label: "Оюутан",    value: analytics.totalStudents,                                   icon: Users,     c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
          { label: "Орлого",    value: formatCurrency(analytics.totalRevenue),                    icon: DollarSign, c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
          { label: "Сертификат", value: analytics.totalCertificates,                              icon: Award,     c: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400" },
          { label: "Үнэлгээ",   value: `${analytics.averageRating}/5`,                           icon: Star,      c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
          { label: "Энэ сар",   value: formatCurrency(monthlyData[monthlyData.length - 1]?.revenue ?? 0), icon: TrendingUp, c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
        ].map(s => (
          <div key={s.label}
            className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <div className={`w-7 h-7 rounded-2xl flex items-center justify-center ${s.c}`}>
                <s.icon size={14} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <InstructorCharts monthlyData={monthlyData} courseStats={courseStats.slice(0, 8)} />
    </div>
  );
}
