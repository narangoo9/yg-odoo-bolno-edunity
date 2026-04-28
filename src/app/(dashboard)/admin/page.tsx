import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, BookOpen, TrendingUp, Award, GraduationCap, Building2, Zap } from "lucide-react";
import { AdminCharts } from "@/components/analytics/AdminCharts";
import {
  getAdminOverview,
  getRevenueByMonth,
  getEnrollmentsByMonth,
  getTopCourses,
  getUserGrowthByMonth,
} from "@/modules/analytics/infrastructure/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Админ самбар" };

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [overview, revenue, enrollments, topCourses, userGrowth] = await Promise.all([
    getAdminOverview().catch(() => ({
      totalUsers: 0, activeStudents: 0, totalCourses: 0, publishedCourses: 0,
      totalEnrollments: 0, totalCertificates: 0, totalRevenue: 0, newUsersThisMonth: 0,
    })),
    getRevenueByMonth(6).catch(() => []),
    getEnrollmentsByMonth(6).catch(() => []),
    getTopCourses(5).catch(() => []),
    getUserGrowthByMonth(6).catch(() => []),
  ]);

  return (
    <div className="space-y-6 animate-fade-up max-w-6xl">

      {/* ── BANNER ── */}
      <div className="relative rounded-2xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #1a0a4a 0%, #3b0764 40%, #1e1b4b 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
        <div className="absolute right-0 top-0 w-72 h-72 bg-purple-400/15 rounded-full blur-3xl" />

        <div className="relative px-7 py-6 flex items-start justify-between">
          <div>
            <p className="text-purple-300 text-sm font-medium mb-1">Системийн тойм</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Админ самбар</h1>
            <div className="flex flex-wrap gap-2">
              {[
                { emoji: "👤", value: overview.totalUsers,      label: "Хэрэглэгч" },
                { emoji: "📚", value: overview.totalCourses,    label: "Курс" },
                { emoji: "💰", value: formatCurrency(overview.totalRevenue), label: "Орлого" },
              ].map(p => (
                <div key={p.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm">
                  <span>{p.emoji}</span>
                  <span className="font-bold">{p.value}</span>
                  <span className="text-purple-200 text-xs">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block opacity-[0.12] pointer-events-none">
            <Building2 size={90} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Нийт хэрэглэгч",   value: overview.totalUsers,        icon: Users,         c: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",   trend: `+${overview.newUsersThisMonth} энэ сар` },
          { label: "Идэвхтэй оюутан",  value: overview.activeStudents,    icon: GraduationCap, c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", trend: null },
          { label: "Нийт курс",        value: overview.totalCourses,      icon: BookOpen,      c: "bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",                trend: null },
          { label: "Нийтлэгдсэн",      value: overview.publishedCourses,  icon: BookOpen,      c: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400", trend: null },
          { label: "Нийт бүртгэл",     value: overview.totalEnrollments,  icon: TrendingUp,    c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",        trend: null },
          { label: "Сертификат",       value: overview.totalCertificates, icon: Award,         c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", trend: null },
        ].map(s => (
          <div key={s.label}
            className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</span>
              <div className={`w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 ${s.c}`}>
                <s.icon size={14} />
              </div>
            </div>
            <p className="text-xl font-black text-foreground tracking-tight">{s.value}</p>
            {s.trend && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{s.trend}</p>}
          </div>
        ))}
      </div>

      {/* ── REVENUE HIGHLIGHT ── */}
      <div className="rounded-2xl p-6 text-white shadow-lg flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={15} className="fill-yellow-300 text-yellow-300" />
            <span className="text-sm font-bold">Нийт орлого</span>
          </div>
          <p className="text-3xl font-black tracking-tight">{formatCurrency(overview.totalRevenue)}</p>
          <p className="text-violet-200 text-xs mt-1">Энэ сар +{overview.newUsersThisMonth} шинэ хэрэглэгч нэмэгдсэн</p>
        </div>
        <TrendingUp size={48} className="opacity-20" strokeWidth={1.5} />
      </div>

      {/* ── CHARTS ── */}
      <AdminCharts
        revenueData={revenue}
        enrollmentData={enrollments}
        userGrowthData={userGrowth}
        topCourses={topCourses}
      />
    </div>
  );
}
