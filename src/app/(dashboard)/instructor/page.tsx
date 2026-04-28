import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Users, Award, BarChart3, Plus, ArrowRight,
  Star, TrendingUp, GraduationCap, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/index";
import { getInstructorAnalytics, getInstructorCourseStats } from "@/modules/analytics/infrastructure/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Багшийн самбар" };

const statusConfig = {
  PUBLISHED:    { label: "Нийтлэгдсэн", variant: "success"   as const },
  DRAFT:        { label: "Ноорог",       variant: "secondary" as const },
  ARCHIVED:     { label: "Архивласан",   variant: "outline"   as const },
  UNDER_REVIEW: { label: "Хянагдаж байна", variant: "warning" as const },
};

export default async function InstructorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["INSTRUCTOR", "ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/student");

  const [analytics, courseStats] = await Promise.all([
    getInstructorAnalytics(session.user.id).catch(() => ({
      totalCourses: 0, totalStudents: 0, totalRevenue: 0,
      totalCertificates: 0, averageRating: 0,
    })),
    getInstructorCourseStats(session.user.id).catch(
      () => [] as Awaited<ReturnType<typeof getInstructorCourseStats>>
    ),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Багш";

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">

      {/* ── WELCOME BANNER ── */}
      <div className="relative rounded-2xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #1e1058 0%, #3b1280 40%, #1e1b4b 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
        <div className="absolute right-0 top-0 w-72 h-72 bg-violet-400/15 rounded-full blur-3xl" />

        <div className="relative px-7 py-6 flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-sm font-medium mb-1">Сайн байна уу,</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
              {firstName} <span className="wave">👋</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              {[
                { emoji: "📚", value: analytics.totalCourses,   label: "Курс" },
                { emoji: "👥", value: analytics.totalStudents,  label: "Оюутан" },
                { emoji: "⭐", value: `${analytics.averageRating.toFixed(1)}/5`, label: "Үнэлгээ" },
              ].map(p => (
                <div key={p.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm">
                  <span>{p.emoji}</span>
                  <span className="font-bold">{p.value}</span>
                  <span className="text-violet-200 text-xs">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block opacity-[0.12] pointer-events-none">
            <GraduationCap size={100} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Нийт курс",   value: analytics.totalCourses,              icon: BookOpen,  c: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400" },
          { label: "Оюутнууд",    value: analytics.totalStudents,             icon: Users,     c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
          { label: "Орлого",      value: formatCurrency(analytics.totalRevenue), icon: TrendingUp, c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
          { label: "Сертификат",  value: analytics.totalCertificates,         icon: Award,     c: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400" },
          { label: "Дундаж үнэлгээ", value: `${analytics.averageRating.toFixed(1)}/5`, icon: Star, c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
        ].map(s => (
          <div key={s.label}
            className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${s.c}`}>
                <s.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── COURSES TABLE ── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-bold text-foreground">Миний курсууд</h2>
          <div className="flex items-center gap-2">
            <Link href="/instructor/courses"
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Бүгдийг харах <ArrowRight size={12} />
            </Link>
            <Link href="/instructor/courses/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/20">
              <Plus size={13} /> Шинэ курс
            </Link>
          </div>
        </div>

        {courseStats.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
              <BookOpen size={24} className="text-violet-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Курс үүсгээгүй байна</p>
            <p className="text-xs text-muted-foreground mt-1">Анхны курсаа үүсгэж эхэл</p>
            <Link href="/instructor/courses/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl transition-colors">
              <Plus size={13} /> Курс үүсгэх
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {courseStats.slice(0, 6).map((course) => {
              const sc = statusConfig[course.status as keyof typeof statusConfig];
              return (
                <div key={course.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.enrollmentCount} оюутан · {course.reviewCount} сэтгэгдэл
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-foreground">{course.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">дүүргэлт</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-foreground">{course.averageRating.toFixed(1)}</span>
                    </div>
                    <Badge variant={sc?.variant ?? "outline"}>{sc?.label ?? course.status}</Badge>
                    <Link href={`/instructor/courses/${course.id}`}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 px-2.5 py-1 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                      Засах
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
