import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  BookOpen, CheckCircle2, Clock, ArrowRight,
  TrendingUp, Star, BarChart2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { MascotImage } from "@/components/brand/MascotImage";

export const metadata: Metadata = { title: "Миний ахиц" };

export default async function StudentProgressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          modules: { include: { lessons: { select: { id: true } } } },
        },
      },
    },
  });

  const progressData = await db.progress.findMany({
    where: { studentId: session.user.id, isCompleted: true },
    select: { courseId: true, lessonId: true },
  });

  const completedByCourse = progressData.reduce<Record<string, number>>((acc, p) => {
    acc[p.courseId] = (acc[p.courseId] ?? 0) + 1;
    return acc;
  }, {});

  const enriched = enrollments.map((enr) => {
    const totalLessons   = enr.course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const completed      = completedByCourse[enr.courseId] ?? 0;
    const percent        = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return { ...enr, totalLessons, completedLessons: completed, percent };
  });

  const active    = enriched.filter((e) => e.status === "ACTIVE");
  const completed = enriched.filter((e) => e.status === "COMPLETED");

  const overallCompleted = enrollments.filter(e => e.status === "COMPLETED").length;
  const overallTotal     = enrollments.length;
  const overallRate      = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">

      {/* ── HERO CARD ──────────────────────────────────────────────── */}
      {enrollments.length > 0 && (
        <div
          className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
          style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #6d28d9 80%, #5b21b6 100%)" }}
        >
          {/* decorative blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-fuchsia-500/10 blur-2xl" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <p className="text-violet-200 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
                📈 Ахицын тойм
              </p>
              <h1 className="text-[2rem] font-black text-white leading-tight mb-1.5">
                Миний ахиц
              </h1>
              <p className="text-violet-200/90 text-[13px] mb-5">
                Өдөр бүр ахиж, зорилгодоо ойртож байна 🚀
              </p>

              {/* Stat pills */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { value: active.length,    label: "идэвхтэй",  icon: "⚡", bg: "bg-violet-500/40" },
                  { value: completed.length, label: "дуусгасан", icon: "✅", bg: "bg-emerald-500/30" },
                  { value: overallTotal,     label: "нийт курс", icon: "📚", bg: "bg-white/10" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${s.bg} backdrop-blur-sm`}
                  >
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-white font-black text-[15px]">{s.value}</span>
                    <span className="text-violet-200 text-[11px] font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-violet-200" />
                    <span className="text-violet-200 text-[12px] font-bold">Нийт гүйцэтгэл</span>
                  </div>
                  <span className="text-white text-2xl font-black">{overallRate}%</span>
                </div>
                <div className="h-3 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-white to-violet-200 animate-progress"
                    style={{ width: `${overallRate}%` }}
                  />
                </div>
                <p className="text-violet-200/80 text-[11px] mt-1.5">
                  {overallCompleted} / {overallTotal} курс дүүргэсэн
                </p>
              </div>
            </div>

            {/* Right: mascot */}
            <div className="shrink-0 hidden sm:flex flex-col items-end relative">
              {/* Speech bubble */}
              <div className="absolute -top-3 right-[106px] bg-white rounded-2xl rounded-br-sm px-3 py-2 shadow-lg max-w-[148px] z-20">
                <p className="text-[10px] font-semibold text-gray-700 leading-snug">
                  Өдөр бүр суралцвал ахиц тод харагдана! 📈
                </p>
                <span className="absolute right-3 -bottom-1.5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-400/30 blur-2xl scale-150 animate-hero-glow" />
                <MascotImage
                  variant="laptop"
                  size={130}
                  priority
                  className="relative z-10 animate-float drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE COURSES ─────────────────────────────────────────── */}
      {active.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <Clock size={13} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-[13px] font-black text-foreground uppercase tracking-wider">
              Суралцаж буй
            </h2>
            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-[10px] font-black rounded-full">
              {active.length}
            </span>
          </div>

          <div className="space-y-4">
            {active.map((enr, idx) => (
              <ActiveCourseCard
                key={enr.id}
                courseId={enr.courseId}
                title={enr.course.title}
                instructor={enr.course.instructor.name}
                thumbnail={enr.course.thumbnailUrl}
                completedLessons={enr.completedLessons}
                totalLessons={enr.totalLessons}
                percent={enr.percent}
                enrolledAt={enr.enrolledAt}
                showBubble={idx === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── WEEKLY PROGRESS CHART ──────────────────────────────────── */}
      {enrollments.length > 0 && (
        <section>
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <BarChart2 size={14} className="text-violet-500" />
                  <h3 className="text-[13px] font-black text-foreground">Ахицын график</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Сүүлийн 7 хоногийн ахиц 🔥
                </p>

                <WeeklyChart />

                <div className="flex justify-between mt-2 px-0.5">
                  {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((d) => (
                    <span key={d} className="text-[9px] text-muted-foreground font-medium">{d}</span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                <MascotImage variant="fire" size={56} className="animate-mascot-bounce" />
                <span className="text-[9px] text-muted-foreground font-bold text-center leading-tight">
                  Streak<br />сахи!
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── COMPLETED COURSES ──────────────────────────────────────── */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-[13px] font-black text-foreground uppercase tracking-wider">
              Дуусгасан
            </h2>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full">
              {completed.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {completed.map((enr) => (
              <CompletedCourseCard
                key={enr.id}
                courseId={enr.courseId}
                title={enr.course.title}
                instructor={enr.course.instructor.name}
                thumbnail={enr.course.thumbnailUrl}
                completedAt={enr.completedAt ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── RECOMMENDED NEXT COURSE ────────────────────────────────── */}
      {enrollments.length > 0 && <RecommendedCard />}

      {/* ── EMPTY STATE ────────────────────────────────────────────── */}
      {enrollments.length === 0 && (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-violet-200 dark:border-violet-800/40">
          <MascotImage variant="wave" size={80} className="mx-auto mb-4 animate-float" />
          <p className="text-sm font-semibold text-foreground mb-1">
            Бүртгүүлсэн курс алга
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Курст бүртгүүлж суралцаж эхэл
          </p>
          <Link
            href="/student/catalog"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl transition-colors"
          >
            Курс хайх <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Active course card ─────────────────────────────────────────── */
function ActiveCourseCard({
  courseId, title, instructor, thumbnail,
  completedLessons, totalLessons, percent, enrolledAt, showBubble,
}: {
  courseId: string; title: string; instructor: string;
  thumbnail: string | null; completedLessons: number;
  totalLessons: number; percent: number;
  enrolledAt: Date; showBubble: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-violet-300 dark:hover:border-violet-700/40 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm group">
      {/* Thumbnail */}
      <div className="w-20 h-16 rounded-2xl bg-muted overflow-hidden shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <LearningArtwork
            title={title}
            subtitle={instructor}
            badge="Lesson"
            compact
            className="h-full w-full"
          />
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground">{instructor}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 animate-progress"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
            {completedLessons}/{totalLessons} хичээл
          </span>
        </div>
      </div>

      {/* Percent + action */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-xl font-black text-violet-600 dark:text-violet-400">{percent}%</span>
        <p className="text-[10px] text-muted-foreground">{formatDate(enrolledAt)}</p>
        <Link
          href={`/student/courses/${courseId}/learn`}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-white bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-xl transition-colors"
        >
          Үргэлжлүүлэх <ArrowRight size={10} />
        </Link>
      </div>

      {/* Mascot + speech bubble (first card only, large screens) */}
      {showBubble && (
        <div className="shrink-0 hidden lg:flex flex-col items-center relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/40 rounded-2xl rounded-bl-sm px-2.5 py-1.5 whitespace-nowrap z-10 shadow-sm">
            <p className="text-[9px] font-semibold text-violet-700 dark:text-violet-300 leading-snug">
              Жаахан ахиц ч том үр дүн шүү! 💪
            </p>
            <span className="absolute left-3 -bottom-1.5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-violet-50 dark:border-t-[#1e1038]" />
          </div>
          <MascotImage variant="thinking" size={52} className="animate-float" />
        </div>
      )}
    </div>
  );
}

/* ── Completed course card ──────────────────────────────────────── */
function CompletedCourseCard({
  courseId, title, instructor, thumbnail, completedAt,
}: {
  courseId: string; title: string; instructor: string;
  thumbnail: string | null; completedAt?: Date;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="h-28 relative overflow-hidden flex-shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <LearningArtwork
            title={title}
            subtitle={instructor}
            badge="Done"
            className="h-full w-full"
          />
        )}
        {/* Completion badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm">
          <CheckCircle2 size={8} /> Дууссэн
        </div>
        {/* Mascot watermark */}
        <div className="absolute -bottom-2 -right-2 opacity-[0.18] pointer-events-none">
          <MascotImage variant="certificate" size={60} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-bold text-foreground line-clamp-1">{title}</p>
        <p className="text-[11px] text-muted-foreground">{instructor}</p>
        {completedAt && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Дууссан: {formatDate(completedAt)}
          </p>
        )}
        <div className="mt-auto pt-3">
          <Link
            href={`/student/courses/${courseId}/learn`}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          >
            Сертификат харах <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Weekly chart — decorative SVG ─────────────────────────────── */
function WeeklyChart() {
  const pts = [
    { x: 0,   y: 54 },
    { x: 43,  y: 40 },
    { x: 86,  y: 50 },
    { x: 129, y: 24 },
    { x: 172, y: 36 },
    { x: 215, y: 14 },
    { x: 258, y: 26 },
  ];

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const area = `${line} L 258,70 L 0,70 Z`;

  return (
    <svg
      viewBox="-4 -8 272 84"
      className="w-full h-[68px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Soft grid lines */}
      {[10, 30, 50, 70].map((y) => (
        <line
          key={y}
          x1="0" y1={y} x2="258" y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
          strokeDasharray="4 4"
        />
      ))}

      {/* Area fill */}
      <path d={area} fill="url(#chartGrad)" />

      {/* Animated line */}
      <path
        d={line}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="700"
        className="animate-chart-draw"
      />

      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" className="[filter:drop-shadow(0_0_4px_rgba(124,58,237,0.3))]" />
          <circle cx={p.x} cy={p.y} r="3" fill="#7c3aed" />
        </g>
      ))}
    </svg>
  );
}

/* ── Recommended / discover CTA ────────────────────────────────── */
function RecommendedCard() {
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Санал болгож буй
            </span>
          </div>
          <h3 className="text-base font-black text-foreground mb-1">
            Дараагийн санал болгож буй курс
          </h3>
          <p className="text-[12px] text-muted-foreground mb-4">
            Шинэ ур чадвар нэмж, ахицаа тасралтгүй дэмж 🚀
          </p>
          <Link
            href="/student/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black text-white shadow-md shadow-violet-200/50 dark:shadow-violet-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
          >
            Каталог үзэх <ArrowRight size={12} />
          </Link>
        </div>
        <div className="shrink-0 hidden sm:block relative">
          <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-2xl scale-150 animate-hero-glow" />
          <MascotImage variant="laptop" size={96} className="relative z-10 animate-float" />
        </div>
      </div>
    </div>
  );
}
