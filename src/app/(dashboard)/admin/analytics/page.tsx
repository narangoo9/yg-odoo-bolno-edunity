import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, BookOpen, TrendingUp, DollarSign, Award, Star } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AdminCharts } from "@/components/analytics/AdminCharts";
import {
  getAdminOverview,
  getRevenueByMonth,
  getEnrollmentsByMonth,
  getTopCourses,
  getUserGrowthByMonth,
} from "@/modules/analytics/infrastructure/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Аналитик" };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [overview, revenue, enrollments, topCourses, userGrowth] = await Promise.all([
    getAdminOverview().catch(() => ({
      totalUsers: 0, activeStudents: 0, totalCourses: 0, publishedCourses: 0,
      totalEnrollments: 0, totalCertificates: 0, totalRevenue: 0, newUsersThisMonth: 0,
    })),
    getRevenueByMonth(12).catch(() => []),
    getEnrollmentsByMonth(12).catch(() => []),
    getTopCourses(10).catch(() => []),
    getUserGrowthByMonth(12).catch(() => []),
  ]);

  // Extra stats
  const [totalReviews, avgRating, completionRate] = await Promise.all([
    db.review.count().catch(() => 0),
    db.review.aggregate({ _avg: { rating: true } }).then((r) => Number(r._avg.rating ?? 0)).catch(() => 0),
    db.enrollment.count({ where: { status: "COMPLETED" } }).then(async (completed) => {
      const total = await db.enrollment.count();
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    }).catch(() => 0),
  ]);

  const recentPayments = await db.payment.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, amount: true, currency: true, createdAt: true, description: true,
      user: { select: { name: true, email: true } },
    },
  }).catch(() => []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">Аналитик</h1>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">Дэлгэрэнгүй статистик мэдээлэл — сүүлийн 12 сар</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Нийт хэрэглэгч" value={overview.totalUsers} icon={Users} color="blue"
          trend={{ value: overview.newUsersThisMonth, label: "энэ сар нэмэгдсэн" }} />
        <StatsCard title="Нийт курс" value={overview.totalCourses} icon={BookOpen} color="default" />
        <StatsCard title="Нийт бүртгэл" value={overview.totalEnrollments} icon={TrendingUp} color="amber" />
        <StatsCard title="Нийт орлого" value={formatCurrency(overview.totalRevenue)} icon={DollarSign} color="green" />
        <StatsCard title="Сертификат" value={overview.totalCertificates} icon={Award} color="purple" />
        <StatsCard title="Дундаж үнэлгээ" value={`${avgRating.toFixed(1)} ⭐`} icon={Star} color="amber" />
      </div>

      {/* Extra KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border p-5">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Дүүргэлтийн хувь</p>
          <p className="text-3xl font-bold text-foreground dark:text-white mt-1">{completionRate}%</p>
          <div className="w-full bg-muted dark:bg-slate-700 rounded-full h-2 mt-3">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Нийт {overview.totalEnrollments} бүртгэлийн</p>
        </div>
        <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border p-5">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Нийтлэгдсэн курс</p>
          <p className="text-3xl font-bold text-foreground dark:text-white mt-1">{overview.publishedCourses}</p>
          <div className="w-full bg-muted dark:bg-slate-700 rounded-full h-2 mt-3">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: overview.totalCourses > 0 ? `${Math.round((overview.publishedCourses / overview.totalCourses) * 100)}%` : "0%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Нийт {overview.totalCourses} курсийн</p>
        </div>
        <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border p-5">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Нийт сэтгэгдэл</p>
          <p className="text-3xl font-bold text-foreground dark:text-white mt-1">{totalReviews}</p>
          <div className="flex gap-0.5 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} className={s <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-muted-foreground"} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Дундаж {avgRating.toFixed(2)} оноо</p>
        </div>
      </div>

      {/* Charts */}
      <AdminCharts
        revenueData={revenue}
        enrollmentData={enrollments}
        userGrowthData={userGrowth}
        topCourses={topCourses}
      />

      {/* Recent payments */}
      <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border dark:border-border">
          <h3 className="text-sm font-semibold text-foreground dark:text-slate-100">Сүүлийн төлбөрүүд</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted dark:bg-slate-700/50 border-b border-border dark:border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">Хэрэглэгч</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase hidden md:table-cell">Тайлбар</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">Дүн</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase hidden sm:table-cell">Огноо</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {recentPayments.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Төлбөр байхгүй байна</td></tr>
            ) : recentPayments.map((p) => (
              <tr key={p.id} className="hover:bg-muted dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-foreground dark:text-slate-100">{p.user.name}</p>
                  <p className="text-xs text-muted-foreground">{p.user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground hidden md:table-cell">{p.description ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(p.amount))}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                  {formatDate(p.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
