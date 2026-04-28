import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  BookOpen, CheckCircle2, Circle, Flame, Star, ArrowRight,
  Calendar, Target, Zap, Clock,
} from "lucide-react";
import { RobotIllustration } from "@/components/brand/RobotIllustration";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { getCourses } from "@/modules/courses/infrastructure/queries";

export const metadata: Metadata = { title: "AI Ментор" };

const DAILY_TASKS = [
  { label: "Өнөөдрийн хичээлийн видео үзэх", xp: 20 },
  { label: "1 практик даалгавар бүрэн хийх", xp: 30 },
  { label: "5 минут тайлбар унших", xp: 10 },
  { label: "Шалгалт/quiz өгөх", xp: 50 },
];

const TIPS = [
  "Өдөр бүр 25 минут суралцах нь долоо хоногт 2.9 цаг гаргасантай тэнцүү!",
  "Шинэ мэдлэг эзэмшихэд давтан харах нь санах ойг 80% сайжруулдаг.",
  "Эхний 5 минут хамгийн хэцүү — эхэлчихвэл автоматаар урагшлах болно.",
  "Streak тасраагүй байх нь суралцах дадлыг тогтоход хамгийн чухал.",
];

export default async function AiMentorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  const dayNames = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  const todayName = dayNames[today.getDay()];
  const tipIndex = today.getDay() % TIPS.length;
  const firstName = session.user.name?.split(" ")[0] ?? "Суралцагч";

  const [user, enrollments, recommended] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true, streak: true },
    }).catch(() => null),
    db.enrollment.findMany({
      where: { studentId: session.user.id, status: { not: "COMPLETED" } },
      include: { course: { select: { id: true, title: true, thumbnailUrl: true, instructor: { select: { name: true } } } } },
      orderBy: { enrolledAt: "desc" },
      take: 3,
    }).catch(() => []),
    getCourses({ status: "PUBLISHED", limit: 4, sortBy: "popular" }).catch(() => ({ courses: [] })),
  ]);

  const streak = user?.streak ?? 0;
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;

  return (
    <div className="max-w-4xl animate-fade-up space-y-5">
      {/* Header hero */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #1a0a3d 0%, #3b0f8c 55%, #6d28d9 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
        <div className="absolute right-4 bottom-0 hidden sm:block pointer-events-none" aria-hidden="true">
          <RobotIllustration size={160} priority alt="" imageClassName="drop-shadow-[0_16px_32px_rgba(0,0,0,0.4)]" />
        </div>
        <div className="relative max-w-lg sm:pr-44">
          <span className="text-[11px] font-bold uppercase tracking-widest text-violet-300">
            {todayName} · AI Ментор
          </span>
          <h1 className="mt-1 text-2xl font-black">Сайн уу, {firstName}! 🤖</h1>
          <p className="mt-1 text-sm text-violet-200">
            Өнөөдрийн суралцах төлөвлөгөөг бэлдлээ. Хамт явцгаая!
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Zap size={11} className="text-yellow-300" /> {xp.toLocaleString()} XP
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Flame size={11} className="text-orange-300" /> {streak} өдрийн streak
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Star size={11} className="text-amber-300" /> Lv.{level}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Today's plan */}
          <section className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-1)" }}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                <Calendar size={15} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-base font-bold text-foreground">Өнөөдрийн төлөвлөгөө</h2>
              <span className="ml-auto text-[11px] text-muted-foreground">{todayName}</span>
            </div>
            <div className="space-y-2.5">
              {DAILY_TASKS.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 transition-all hover:border-violet-200 hover:bg-violet-50/50 dark:hover:border-violet-800/40 dark:hover:bg-violet-500/5"
                >
                  <Circle size={16} className="shrink-0 text-violet-300 dark:text-violet-700" />
                  <span className="flex-1 text-[13px] text-foreground">{task.label}</span>
                  <div className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 dark:bg-violet-500/15">
                    <Zap size={9} className="text-violet-600 dark:text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">+{task.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Бүх даалгавраа хийвэл нийт <span className="font-bold text-violet-600">+{DAILY_TASKS.reduce((s, t) => s + t.xp, 0)} XP</span> авна!
            </p>
          </section>

          {/* Active courses */}
          {enrollments.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-1)" }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                    <BookOpen size={15} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">Үргэлжлүүлэх хичээл</h2>
                </div>
                <Link href="/student/courses" className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline dark:text-violet-400">
                  Бүгд <ArrowRight size={11} />
                </Link>
              </div>
              <div className="space-y-2">
                {enrollments.map(({ course }) => (
                  <Link
                    key={course.id}
                    href={`/student/courses/${course.id}/learn`}
                    className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-violet-300 hover:shadow-sm dark:hover:border-violet-700/40"
                  >
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                      ) : (
                        <LearningArtwork title={course.title} subtitle={course.instructor.name} badge="Course" compact className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">{course.title}</p>
                      <p className="text-[10px] text-muted-foreground">{course.instructor.name}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-violet-700 transition-colors group-hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:group-hover:bg-violet-500/20">
                      <Clock size={10} /> Үргэлжлүүлэх
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI tip */}
          <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-50 p-4 dark:border-violet-800/30 dark:from-violet-900/10 dark:to-purple-900/10">
            <div className="mb-3 flex items-center gap-2">
              <RobotIllustration size={36} alt="" />
              <div>
                <p className="text-[11px] font-black text-violet-700 dark:text-violet-300">Robo зөвлөгөө</p>
                <p className="text-[9px] text-muted-foreground">Өнөөдрийн зөвлөмж</p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-foreground">{TIPS[tipIndex]}</p>
          </div>

          {/* Streak */}
          <div className={`rounded-2xl border p-4 ${
            streak > 0
              ? "border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-800/30 dark:from-orange-900/10 dark:to-amber-900/10"
              : "border-slate-200/60 bg-card dark:border-slate-800/30"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${streak > 0 ? "bg-orange-100 dark:bg-orange-500/15" : "bg-muted"}`}>
                {streak > 0 ? "🔥" : "😢"}
              </div>
              <div>
                <p className="text-[13px] font-black text-foreground">
                  {streak > 0 ? `${streak} өдрийн streak!` : "Streak дуусчихсан"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {streak > 0 ? "Гайхалтай! Үргэлжлүүл 💪" : "Өнөөдөр эхлүүлэх цаг болсон!"}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended */}
          <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-1)" }}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                <Target size={13} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-[13px] font-bold text-foreground">Санал болгох</h3>
            </div>
            <div className="space-y-2">
              {(recommended.courses ?? []).slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted dark:hover:bg-white/5"
                >
                  <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <LearningArtwork title={course.title} subtitle={course.instructor.name} badge="Course" compact className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">{course.title}</p>
                    <p className="text-[9px] text-muted-foreground">{course.instructor.name}</p>
                  </div>
                  <ArrowRight size={11} className="shrink-0 text-muted-foreground group-hover:text-violet-500" />
                </Link>
              ))}
            </div>
            <Link href="/student/catalog" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 py-2 text-[11px] font-bold text-violet-600 transition-colors hover:bg-violet-50 dark:border-violet-800/40 dark:text-violet-400 dark:hover:bg-violet-500/10">
              Каталог харах <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
