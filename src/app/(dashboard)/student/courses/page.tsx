import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, ArrowRight, Plus, Target,
  Clock, CheckCircle2, ChevronDown, Calendar, Award, Users,
} from "lucide-react";
import { getStudentEnrolledCourses, getCourses } from "@/modules/courses/infrastructure/queries";
import { db } from "@/lib/db";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { MascotImage } from "@/components/brand/MascotImage";

export const metadata: Metadata = { title: "Миний курсууд — EduNity" };

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

type FilterValue = "all" | "active" | "completed" | "certified" | "newest";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Бүгд", value: "all" },
  { label: "Суралцаж буй", value: "active" },
  { label: "Дуусгасан", value: "completed" },
  { label: "Сертификаттай", value: "certified" },
  { label: "Хамгийн шинэ", value: "newest" },
];

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "Анхан шат",
  INTERMEDIATE: "Дунд тувшин",
  ADVANCED: "Дэвшилтэт",
  ALL_LEVELS: "Бүх түвшин",
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function StudentCoursesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const filter = (sp.filter ?? "all") as FilterValue;

  const [enrollments, progressMap, userProfile, recommendedResult] = await Promise.all([
    getStudentEnrolledCourses(session.user.id),
    db.progress.groupBy({
      by: ["courseId"],
      where: { studentId: session.user.id, isCompleted: true },
      _count: true,
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { streak: true, name: true },
    }),
    getCourses({ status: "PUBLISHED", limit: 4, sortBy: "popular" }).catch(() => ({ courses: [] })),
  ]);

  const progressLookup = new Map(progressMap.map((p) => [p.courseId, p._count]));
  const active    = enrollments.filter((e) => e.status !== "COMPLETED");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const totalDone = progressMap.reduce((sum, p) => sum + p._count, 0);

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const recommended = (recommendedResult.courses ?? [])
    .filter((c) => !enrolledIds.has(c.id))
    .slice(0, 1);

  const displayActive    = (filter === "all" || filter === "active" || filter === "newest") ? active : [];
  const displayCompleted = (filter === "all" || filter === "completed" || filter === "certified") ? completed : [];

  const streak = userProfile?.streak ?? 0;

  return (
    <div className="space-y-5 animate-fade-up max-w-5xl">

      {/* ── HERO HEADER CARD ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-[#F3F0FF] to-[#F9F7FF] dark:from-[#1C142B] dark:via-[#180F28] dark:to-[#150F22] border border-[#E9DFFF] dark:border-[#2E2146]">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.038]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute right-[190px] top-[-24px] h-52 w-52 rounded-full bg-violet-300/30 dark:bg-violet-600/15 blur-[72px] pointer-events-none" />
        <div className="absolute left-[-16px] bottom-[-16px] h-40 w-40 rounded-full bg-fuchsia-200/25 dark:bg-fuchsia-900/10 blur-[56px] pointer-events-none" />

        {/* ── Left content ── */}
        <div className="relative z-10 px-7 py-6 sm:pr-[200px]" style={{ minHeight: 172 }}>
          {/* "+ Курс нэмэх" button top-right (inside hero, before mascot area) */}
          <Link
            href="/courses"
            className="absolute top-5 right-5 sm:right-[210px] hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-2xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.32)]"
          >
            <Plus size={13} /> Курс нэмэх
          </Link>

          <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-1">
            Хичээлүүд
          </p>
          <h1 className="text-[26px] font-black text-[#111827] dark:text-[#F8FAFC] tracking-tight leading-tight mb-1">
            Миний курсууд
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] mb-5">
            Үргэлжлүүлэн суралцаж, ахицаа нэмээрэй.
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                icon: BookOpen,
                value: active.length,
                label: "Идэвхтэй",
                iconCls: "text-violet-600 dark:text-violet-400",
                pillCls: "bg-white dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20",
              },
              {
                icon: CheckCircle2,
                value: completed.length,
                label: "Дуусгасан",
                iconCls: "text-emerald-600 dark:text-emerald-400",
                pillCls: "bg-white dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
              },
              {
                icon: BookOpen,
                value: enrollments.length,
                label: "Нийт курс",
                iconCls: "text-[#6B7280] dark:text-[#A1A1AA]",
                pillCls: "bg-white/80 dark:bg-white/5 border-[#E9DFFF] dark:border-white/10",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-sm ${s.pillCls}`}
              >
                <s.icon size={13} className={s.iconCls} />
                <span className="text-[13px] font-black text-[#111827] dark:text-[#F8FAFC]">{s.value}</span>
                <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mascot + speech bubble ── */}
        <div
          className="pointer-events-none absolute bottom-0 right-6 sm:right-10 z-20 hidden sm:flex flex-col items-center"
          aria-hidden="true"
        >
          {/* Speech bubble */}
          <div className="relative mb-1.5 w-[152px] rounded-2xl rounded-br-sm bg-white dark:bg-[#1C142B] px-3.5 py-2.5 shadow-[0_4px_18px_rgba(124,58,237,0.14)] border border-[#E9DFFF] dark:border-[#2E2146]">
            <p className="text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-snug">
              Өнөөдөр нэг<br />хичээл дуусгая! 📚
            </p>
            <div className="absolute -bottom-[6px] right-5 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-[#1C142B]" />
          </div>
          <MascotImage variant="book" size={118} className="animate-float" />
        </div>
      </section>

      {/* ── FILTER PILLS ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/student/courses" : `/student/courses?filter=${f.value}`}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
              filter === f.value
                ? "bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.28)]"
                : "bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] text-[#6B7280] dark:text-[#A1A1AA] hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <div className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] text-xs text-[#6B7280] dark:text-[#A1A1AA] whitespace-nowrap">
          Сүүд үзсэн <ChevronDown size={11} />
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      {enrollments.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40 bg-white dark:bg-[#1C142B] py-16 text-center">
          <MascotImage variant="book" size={80} className="mx-auto mb-4 animate-mascot-bounce" />
          <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Бүртгүүлсэн курс алга</p>
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-5">
            Каталогоос сонирхолтой курс хайж бүртгүүлээрэй
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl transition-colors"
          >
            Курс хайх <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <>
          {/* ── ACTIVE COURSES ─────────────────────────────────────── */}
          {displayActive.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-[#6B7280] dark:text-[#A1A1AA] uppercase tracking-[0.18em]">
                Суралцаж буй
              </h2>

              <div className="space-y-4">
                {displayActive.map((enr, i) => {
                  const total   = enr.course._count.modules;
                  const done    = progressLookup.get(enr.courseId) ?? 0;
                  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                  /* ── First active course: wide layout + summary panel ── */
                  if (i === 0) {
                    return (
                      <div key={enr.id} className="grid xl:grid-cols-[1fr_264px] gap-4">

                        {/* Wide active course card */}
                        <div className="group bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl overflow-hidden hover:shadow-[0_8px_32px_rgba(124,58,237,0.10)] dark:hover:shadow-[0_8px_32px_rgba(167,139,250,0.07)] hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex" style={{ minHeight: 184 }}>
                            {/* Gradient thumbnail */}
                            <div className="w-[196px] shrink-0 relative overflow-hidden">
                              {enr.course.thumbnailUrl ? (
                                <img
                                  src={enr.course.thumbnailUrl}
                                  alt={enr.course.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <LearningArtwork
                                  title={enr.course.title}
                                  subtitle={enr.course.instructor.name}
                                  badge="COURSE"
                                  className="h-full w-full"
                                />
                              )}
                            </div>

                            {/* Course details */}
                            <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0">
                              <div>
                                <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">
                                  Программчлал
                                </span>
                                <h3 className="font-black text-[#111827] dark:text-[#F8FAFC] text-[16px] leading-snug mt-0.5 mb-1 line-clamp-2">
                                  {enr.course.title}
                                </h3>
                                <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-4">
                                  {enr.course.instructor.name}
                                </p>
                                {/* Progress */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="flex-1 h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 shrink-0">
                                    {percent}%
                                  </span>
                                </div>
                                <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">
                                  {done} / {total} хичээл
                                </p>
                              </div>

                              {/* CTA */}
                              <Link
                                href={`/student/courses/${enr.course.id}/learn`}
                                className="inline-flex items-center gap-2 self-start mt-3 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/20"
                              >
                                Үргэлжлүүлэх <ArrowRight size={13} />
                              </Link>
                            </div>

                            {/* Mascot-thinking (right edge, hidden on small) */}
                            <div className="hidden md:flex flex-col items-center justify-center px-4 pb-3 shrink-0 gap-2.5">
                              <div className="relative bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-3 py-2.5 border border-violet-100 dark:border-violet-500/20 max-w-[118px] text-center">
                                <p className="text-[10px] font-semibold text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
                                  Жаахан ахиц ч<br />том үр дүн шүү! 💪
                                </p>
                                <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-violet-50 dark:border-t-[#2d1f4a]" />
                              </div>
                              <MascotImage variant="thinking" size={72} className="animate-float" />
                            </div>
                          </div>
                        </div>

                        {/* ── Суралцах тойм (Study summary) ── */}
                        <div className="bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl p-5 flex flex-col gap-3.5">
                          <p className="text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC] uppercase tracking-[0.18em]">
                            Суралцах тойм
                          </p>
                          {[
                            {
                              icon: Target,
                              label: "Өнөөдрийн зорилго",
                              value: "1 хичээл үзэх",
                              iconCls: "text-violet-500",
                              iconBg: "bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20",
                            },
                            {
                              icon: Clock,
                              label: "Үргэлжилсэн өдөр",
                              value: `${streak} өдөр`,
                              iconCls: "text-amber-500",
                              iconBg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
                            },
                            {
                              icon: BookOpen,
                              label: "Нийт суралцсан",
                              value: `${totalDone} хичээл`,
                              iconCls: "text-emerald-500",
                              iconBg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
                            },
                          ].map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}
                              >
                                <item.icon size={14} className={item.iconCls} />
                              </div>
                              <div>
                                <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1AA]">{item.label}</p>
                                <p className="text-[13px] font-bold text-[#111827] dark:text-[#F8FAFC]">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  /* ── Additional active courses: compact horizontal card ── */
                  return (
                    <Link
                      key={enr.id}
                      href={`/student/courses/${enr.course.id}/learn`}
                      className="group flex bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl overflow-hidden hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 transition-all duration-200 h-[88px]"
                    >
                      <div className="w-[88px] shrink-0 relative overflow-hidden">
                        {enr.course.thumbnailUrl ? (
                          <img
                            src={enr.course.thumbnailUrl}
                            alt={enr.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <LearningArtwork title={enr.course.title} compact className="h-full w-full" />
                        )}
                      </div>
                      <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
                        <p className="font-bold text-[#111827] dark:text-[#F8FAFC] text-sm line-clamp-1 mb-0.5">
                          {enr.course.title}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-2">{enr.course.instructor.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold shrink-0">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="px-4 flex items-center shrink-0">
                        <ArrowRight
                          size={14}
                          className="text-violet-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── COMPLETED COURSES ──────────────────────────────────── */}
          {displayCompleted.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold text-[#6B7280] dark:text-[#A1A1AA] uppercase tracking-[0.18em]">
                  Дуусгасан
                </h2>
                <Link
                  href="/student/certificates"
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                >
                  Бүгдийг харах <ArrowRight size={11} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {displayCompleted.map((enr) => (
                  <div
                    key={enr.id}
                    className="group bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl overflow-hidden hover:shadow-[0_8px_28px_rgba(20,184,166,0.10)] dark:hover:shadow-[0_8px_28px_rgba(16,185,129,0.07)] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-[152px] overflow-hidden">
                      {enr.course.thumbnailUrl ? (
                        <img
                          src={enr.course.thumbnailUrl}
                          alt={enr.course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <LearningArtwork
                          title={enr.course.title}
                          subtitle={enr.course.instructor.name}
                          badge="COMPLETED"
                          className="h-full w-full"
                        />
                      )}
                      {/* Green tint overlay */}
                      <div className="absolute inset-0 bg-emerald-800/35" />
                      {/* COMPLETED badge */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-[0.14em] shadow-sm">
                        COMPLETED
                      </span>
                      {/* Certificate icon badge */}
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Award size={14} className="text-white" />
                      </div>
                      {/* Mascot-certificate overlay at bottom-right */}
                      <div className="absolute bottom-[-4px] right-2 pointer-events-none">
                        <MascotImage variant="certificate" size={52} />
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <p className="font-bold text-[#111827] dark:text-[#F8FAFC] text-sm line-clamp-2 leading-snug mb-1">
                        {enr.course.title}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-2.5">
                        {enr.course.instructor.name}
                      </p>
                      {enr.completedAt && (
                        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                          <Calendar size={11} />
                          Дуусан: {fmtDate(enr.completedAt)}
                        </p>
                      )}
                      <Link
                        href="/student/certificates"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E9DFFF] dark:border-[#2E2146] text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                      >
                        Сертификат харах <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── RECOMMENDED NEXT COURSE ────────────────────────────── */}
          {recommended.length > 0 && (
            <section>
              <div className="group bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl overflow-hidden hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-4 p-5 relative">
                  {/* Small thumbnail */}
                  <div className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 relative">
                    {recommended[0].thumbnailUrl ? (
                      <img
                        src={recommended[0].thumbnailUrl}
                        alt={recommended[0].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <LearningArtwork title={recommended[0].title} compact className="h-full w-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-0.5">
                      Дараагийн санал болгож буй курс
                    </p>
                    <p className="font-black text-[#111827] dark:text-[#F8FAFC] text-[15px] line-clamp-1 mb-0.5">
                      {recommended[0].title}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">
                      {recommended[0].instructor.name} · {LEVEL_MAP[recommended[0].level] ?? "Бүх түвшин"}
                    </p>
                  </div>

                  {/* Lesson count */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs text-[#6B7280] dark:text-[#A1A1AA]">
                    <Users size={12} />
                    {recommended[0]._count.modules} хичээл
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/courses/${recommended[0].slug}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/20"
                  >
                    Үзэх <ArrowRight size={13} />
                  </Link>

                  {/* Mascot-laptop decoration */}
                  <div className="hidden lg:block shrink-0 pointer-events-none">
                    <MascotImage variant="laptop" size={64} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
