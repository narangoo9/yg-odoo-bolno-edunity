import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Star,
  Trophy,
  Users,
  MessageSquare,
  GitMerge,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/db";
import { getStudentStats } from "@/modules/analytics/infrastructure/queries";
import { getStudentEnrolledCourses, getCourses } from "@/modules/courses/infrastructure/queries";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";
import { hasActiveCourseAccess } from "@/lib/subscription-access";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { LearningJourneyCard } from "@/components/student/LearningJourneyCard";
import { getStripe } from "@/lib/stripe";
import { syncLatestStripeSubscriptionForUser } from "@/lib/stripe/subscription-sync";
import { dashboardCacheTags } from "@/lib/dashboard-cache";
import type { ElementType } from "react";

// Cached: popular recommended courses (shared across all students — no userId in key)
const getCachedPopularCourses = unstable_cache(
  () => getCourses({ status: "PUBLISHED", limit: 4, sortBy: "popular" }),
  ["student-dashboard-recommended"],
  { revalidate: 120, tags: ["courses:popular"] },
);

// Cached: per-student dashboard data bundle. Runs all queries in parallel.
const getCachedStudentDashboardData = (studentId: string) =>
  unstable_cache(
    async () => {
      // Phase 1: stats, enrollments, subscription — all parallel.
      const [stats, enrollments, subscription] = await Promise.all([
        getStudentStats(studentId),
        getStudentEnrolledCourses(studentId),
        db.subscription.findUnique({
          where: { userId: studentId },
          select: { plan: true, status: true },
        }),
      ]);

      // Phase 2: derive in-progress course IDs then fetch their progress in parallel.
      const inProgressIds = enrollments
        .filter((e) => e.status !== "COMPLETED")
        .slice(0, 2)
        .map((e) => e.courseId);

      const [progressData, moduleData] = await Promise.all([
        inProgressIds.length > 0
          ? db.progress.groupBy({
              by: ["courseId"],
              where: { studentId, isCompleted: true, courseId: { in: inProgressIds } },
              _count: true,
            })
          : Promise.resolve([] as { courseId: string; _count: number }[]),
        inProgressIds.length > 0
          ? db.courseModule.findMany({
              where: { courseId: { in: inProgressIds } },
              select: { courseId: true, _count: { select: { lessons: true } } },
            })
          : Promise.resolve([] as { courseId: string; _count: { lessons: number } }[]),
      ]);

      return { stats, enrollments, subscription, progressData, moduleData };
    },
    [`student-dashboard-${studentId}`],
    {
      revalidate: 30,
      tags: [dashboardCacheTags.user(studentId), dashboardCacheTags.sidebar(studentId)],
    },
  )();

export const metadata: Metadata = { title: "Dashboard - EduNity" };

const EMPTY_STATES: {
  title: string; desc: string; link: string; href: string;
  BadgeIcon: ElementType; badgeBg: string; badgeColor: string;
  mascot: MascotVariant;
}[] = [
  {
    title: "Сертификат",
    desc: "Шинэ хичээл дуусгаад гэрчилгээ аваарай!",
    link: "Хичээл үзэх",
    href: "/student/courses",
    BadgeIcon: Award,
    badgeBg: "bg-violet-100 dark:bg-violet-500/20",
    badgeColor: "text-violet-600 dark:text-violet-400",
    mascot: "certificate",
  },
  {
    title: "Мессеж алга байна",
    desc: "Багш, найзуудтайгаа харилцаарай!",
    link: "Харилцах",
    href: "/student/messages",
    BadgeIcon: MessageSquare,
    badgeBg: "bg-blue-100 dark:bg-blue-500/20",
    badgeColor: "text-blue-600 dark:text-blue-400",
    mascot: "thinking",
  },
  {
    title: "Peer Review алга",
    desc: "Бусдын ажлыг үнэлж, тоглогоо хуваалцаарай!",
    link: "Үнэлгэж өгөх",
    href: "/student/peer-review",
    BadgeIcon: GitMerge,
    badgeBg: "bg-orange-100 dark:bg-orange-500/20",
    badgeColor: "text-orange-600 dark:text-orange-400",
    mascot: "laptop",
  },
  {
    title: "Хичээл алга байна",
    desc: "Каталогоос сонирхолтой хичээлээ сонгооро!",
    link: "Каталог үзэх",
    href: "/student/catalog",
    BadgeIcon: BookOpen,
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/20",
    badgeColor: "text-emerald-600 dark:text-emerald-400",
    mascot: "book",
  },
];

const COURSE_MASCOTS: MascotVariant[] = ["book", "laptop", "wave", "thinking"];

interface PageProps {
  searchParams?: Promise<{ subscription?: string }>;
}

export default async function StudentDashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "USER") {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "/admin",
      COMPANY: "/org",
    };
    redirect(roleMap[session.user.role] ?? "/student");
  }

  const sp = await searchParams;

  // Run everything in parallel: cached bundle + cached popular courses.
  const [dashboardData, recommendedResult] = await Promise.all([
    getCachedStudentDashboardData(session.user.id).catch(() => null),
    getCachedPopularCourses().catch(() => ({ courses: [], total: 0 })),
  ]);

  const stats = dashboardData?.stats ?? {
    enrolledCourses: 0,
    completedCourses: 0,
    completedLessons: 0,
    certificates: 0,
    quizAttempts: 0,
    averageQuizScore: 0,
  };
  const enrollments = dashboardData?.enrollments ?? [];
  const subscription = dashboardData?.subscription ?? null;
  const progressData = dashboardData?.progressData ?? [];
  const moduleData = dashboardData?.moduleData ?? [];

  // Off-path: only on Stripe return with success param do we touch Stripe.
  if (sp?.subscription === "success" && (!subscription || subscription.status !== "ACTIVE")) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, stripeCustomerId: true },
    }).catch(() => null);

    await syncLatestStripeSubscriptionForUser({
      stripe: getStripe(),
      userId: session.user.id,
      email: user?.email ?? session.user.email,
      stripeCustomerId: user?.stripeCustomerId,
    }).catch((error) => {
      console.error("Subscription return sync failed:", error);
      return null;
    });
  }

  const firstName = session.user.name?.split(" ")[0] ?? "Student";
  const inProgress = enrollments.filter((e) => e.status !== "COMPLETED").slice(0, 2);

  const progressLookup = new Map(progressData.map((p) => [p.courseId, p._count]));
  const totalLessonsMap = new Map<string, number>();
  moduleData.forEach((m) => {
    totalLessonsMap.set(m.courseId, (totalLessonsMap.get(m.courseId) ?? 0) + m._count.lessons);
  });
  const completionRate =
    stats.enrolledCourses > 0
      ? Math.round((stats.completedCourses / stats.enrolledCourses) * 100)
      : 0;
  const recommended = recommendedResult.courses ?? [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasCourseAccess = hasActiveCourseAccess(subscription?.plan, subscription?.status);

  const STAT_CARDS = [
    {
      labelEn: "ENROLLED",
      labelMn: "Нийт хичээл",
      value: stats.enrolledCourses,
      icon: BookOpen,
      color: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    },
    {
      labelEn: "COMPLETED",
      labelMn: "Дуусан хичээл",
      value: stats.completedCourses,
      icon: Trophy,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      labelEn: "CERTIFICATES",
      labelMn: "Авах гэрчилгэа",
      value: stats.certificates,
      icon: Award,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
    {
      labelEn: "COMPLETION",
      labelMn: "Нийт ахиц",
      value: `${completionRate}%`,
      icon: BarChart3,
      color: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
    },
  ];

  return (
    <div className="max-w-5xl animate-fade-up space-y-5">

      {/* ── HERO BANNER (animated client component) ── */}
      <HeroBanner
        firstName={firstName}
        completed={stats.completedCourses}
        enrolled={stats.enrolledCourses}
        certificates={stats.certificates}
      />

      <LearningJourneyCard
        stats={{
          enrolledCourses: stats.enrolledCourses,
          completedLessons: stats.completedLessons,
          completedCourses: stats.completedCourses,
          certificates: stats.certificates,
          quizAttempts: stats.quizAttempts,
        }}
        continueHref={
          inProgress[0]
            ? `/student/courses/${inProgress[0].course.id}/learn`
            : null
        }
      />

      {/* ── STATS CARDS ── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((item) => (
          <div
            key={item.labelEn}
            className="glow-card rounded-2xl border border-border bg-white p-4 dark:bg-card"
            style={{ boxShadow: "var(--shadow-1)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {item.labelEn}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.color}`}>
                <item.icon size={15} />
              </div>
            </div>
            <p className="text-[28px] font-black leading-none tracking-tight text-foreground">
              {item.value}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{item.labelMn}</p>
          </div>
        ))}
      </section>

      {/* ── CONTINUE LEARNING ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Үргэлжлүүлэн суралцах</h2>
          <Link
            href="/student/courses"
            className="flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            Бүгдийг харах <ArrowRight size={12} />
          </Link>
        </div>

        {inProgress.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-white py-10 text-center dark:border-violet-800/40 dark:bg-card">
            <MascotImage
              variant="wave"
              size={72}
              className="mx-auto mb-3 animate-mascot-bounce"
            />
            <p className="text-sm font-semibold text-foreground">Идэвхтэй хичээл байхгүй байна</p>
            <p className="mt-1 text-xs text-muted-foreground">Каталог үзэж шинэ хичээл эхлүүлээрэй!</p>
            <Link
              href="/student/catalog"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-violet-500"
            >
              Курс хайх <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgress.map(({ course }) => {
              const done = progressLookup.get(course.id) ?? 0;
              const total = totalLessonsMap.get(course.id) ?? 0;
              const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
              return (
              <div
                key={course.id}
                className="group relative overflow-visible rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-md dark:bg-card"
                style={{ boxShadow: "var(--shadow-1)" }}
              >
                <div className="flex items-center gap-4 p-5 sm:pr-[210px]">
                  {/* Thumbnail */}
                  <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <LearningArtwork
                        title={course.title}
                        subtitle={course.instructor.name}
                        badge="Курс"
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[15px] font-bold leading-snug text-foreground">
                      {course.title}
                    </p>
                    <p className="mb-3 text-[12px] text-muted-foreground">{course.instructor.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                        <div
                          className="shimmer-bar relative h-full overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-purple-400 animate-progress transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{percent}%</span>
                    </div>
                    <Link
                      href={`/student/courses/${course.id}/learn`}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400"
                    >
                      Үргэлжлүүлэх <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Mascot + speech bubble (right) */}
                <div className="pointer-events-none absolute right-4 top-1/2 hidden sm:flex -translate-y-1/2 flex-col items-center gap-2">
                  {/* Speech bubble */}
                  <div className="relative rounded-2xl rounded-b-2xl rounded-br-sm border border-border bg-white px-3 py-2.5 shadow-md dark:bg-card">
                    <p className="max-w-[136px] text-center text-[11px] font-semibold leading-snug text-foreground">
                      Үргэлжлүүлээд ахицаа нэмээрэй!
                    </p>
                    <div className="absolute -bottom-[6px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-card" />
                  </div>
                  <MascotImage variant="book" size={88} className="animate-float" />
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RECOMMENDED FOR YOU ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
              <GraduationCap size={14} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-foreground">Танд санал болгож буй</h2>
          </div>
          <Link
            href="/student/catalog"
            className="flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            Бүгдийг харах <ArrowRight size={12} />
          </Link>
        </div>

        {recommended.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-white py-10 text-center dark:border-violet-800/40 dark:bg-card">
            <MascotImage
              variant="book"
              size={72}
              className="mx-auto mb-3 animate-mascot-bounce"
            />
            <p className="text-sm font-semibold text-foreground">Одоогоор курс байхгүй байна</p>
            <p className="mt-1 text-xs text-muted-foreground">Удахгүй шинэ хичээлүүд нэмэгдэнэ!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.map((course, index) => {
              const avgRating = course.averageRating > 0 ? course.averageRating.toFixed(1) : null;

              const levelColors: Record<string, string> = {
                BEGINNER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                ADVANCED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
                ALL_LEVELS: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
              };
              const levelLabels: Record<string, string> = {
                BEGINNER: "Beginner",
                INTERMEDIATE: "Intermediate",
                ADVANCED: "Advanced",
                ALL_LEVELS: "All Levels",
              };

              const mascotVariant = COURSE_MASCOTS[index % COURSE_MASCOTS.length];

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex min-h-[132px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-100 hover:shadow-md dark:bg-card"
                  style={{ boxShadow: "var(--shadow-1)" }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-auto w-[120px] shrink-0 overflow-hidden bg-muted">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <LearningArtwork
                        title={course.title}
                        subtitle={course.instructor.name}
                        badge={course.category?.name ?? "Course"}
                        className="h-full w-full min-h-[120px]"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="relative flex min-w-0 flex-1 flex-col justify-between p-3.5 pr-4 sm:pr-[98px]">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${levelColors[course.level] ?? "bg-gray-100 text-gray-700"}`}>
                          {levelLabels[course.level] ?? course.level}
                        </span>
                        {course.category && (
                          <span className="text-[10px] text-muted-foreground">{course.category.name}</span>
                        )}
                      </div>
                      <p className="mb-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-foreground">
                        {course.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{course.instructor.name}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {avgRating && (
                        <div className="flex items-center gap-0.5">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold text-foreground">{avgRating}</span>
                          <span className="text-[10px] text-muted-foreground">({course.reviewCount})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 text-muted-foreground">
                        <Users size={10} />
                        <span className="text-[10px]">{course._count.enrollments} хичээл</span>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 drop-shadow-[0_12px_24px_rgba(88,28,135,0.18)] hidden sm:block">
                      <MascotImage
                        variant={mascotVariant}
                        size={80}
                        className="transition-transform duration-200 group-hover:-translate-y-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── QUICK ACCESS SECTION ── */}
      <section>
        <h2 className="mb-4 text-base font-bold text-foreground">Шуурхай хандалт</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EMPTY_STATES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md dark:bg-card"
              style={{ boxShadow: "var(--shadow-1)" }}
            >
              {/* Mascot with badge */}
              <div className="relative mx-auto mb-3 w-fit">
                <MascotImage variant={item.mascot} size={58} />
                <div
                  className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${item.badgeBg}`}
                >
                  <item.BadgeIcon size={13} className={item.badgeColor} />
                </div>
              </div>
              <p className="text-[12px] font-bold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{item.desc}</p>
              <Link
                href={item.href}
                className="mt-3 block text-[11px] font-bold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400"
              >
                {item.link} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
