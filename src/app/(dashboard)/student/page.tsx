import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import { DashboardTourWrapper } from "@/components/onboarding/DashboardTourWrapper";
import type { ElementType } from "react";

export const metadata: Metadata = { title: "Dashboard - EduNity" };

const EMPTY_STATES: {
  title: string; desc: string; link: string; href: string;
  BadgeIcon: ElementType; badgeBg: string; badgeColor: string;
  mascot: MascotVariant;
}[] = [
  {
    title: "Гарчилгаа алга байна",
    desc: "Шинэ хичээл дуусгаад гэрчилгэа аваарай!",
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

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "STUDENT") {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "/admin",
      ORG_ADMIN: "/org",
      INSTRUCTOR: "/instructor",
    };
    redirect(roleMap[session.user.role] ?? "/student");
  }

  const [stats, enrollments, recommendedResult, subscription] = await Promise.all([
    getStudentStats(session.user.id).catch(() => ({
      enrolledCourses: 0,
      completedCourses: 0,
      completedLessons: 0,
      certificates: 0,
      quizAttempts: 0,
      averageQuizScore: 0,
    })),
    getStudentEnrolledCourses(session.user.id).catch(
      () => [] as Awaited<ReturnType<typeof getStudentEnrolledCourses>>,
    ),
    getCourses({ status: "PUBLISHED", limit: 4, sortBy: "popular" }).catch(
      () => ({ courses: [], total: 0 }),
    ),
    db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true },
    }).catch(() => null),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Student";
  const inProgress = enrollments.filter((e) => e.status !== "COMPLETED").slice(0, 2);
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

      {/* ── HERO BANNER ── */}
      <section
        className="relative overflow-hidden rounded-3xl text-white"
        style={{
          background: "linear-gradient(135deg, #2f0f68 0%, #521a97 52%, #7c2fe4 100%)",
          boxShadow: "var(--shadow-4)",
        }}
      >
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.45) 1px,transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        {/* glow blobs */}
        <div className="absolute right-[-42px] top-[-54px] h-56 w-56 rounded-full bg-fuchsia-300/22 blur-3xl" />
        <div className="absolute bottom-[-74px] right-[10px] h-48 w-48 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="absolute left-[-16px] top-[-8px] h-28 w-28 rounded-full bg-rose-200/16 blur-3xl" />

        <div className="relative min-h-[184px] px-6 py-5 sm:pr-[230px] md:pr-[370px]">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100/80">
              Welcome back,
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-tight">
              {firstName}! 👋
            </h1>
            <p className="mt-1 text-[14px] font-medium text-white/88">
              Өнөөдөр 1 хичээл үргэлжлүүлье. Амжилт хүсье! 💜
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Trophy, value: stats.completedCourses, label: "Completed" },
                { icon: BookOpen, value: stats.enrolledCourses, label: "Enrolled" },
                { icon: Award, value: stats.certificates, label: "Certificates" },
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[12px] font-medium backdrop-blur-sm"
                >
                  <Icon size={11} className="text-violet-200" />
                  <span className="font-bold">{value}</span>
                  <span className="text-violet-200">{label}</span>
                </div>
              ))}
              {/* Dashboard tour trigger (client component — renders conditionally) */}
              <DashboardTourWrapper />
            </div>
          </div>

          {/* Mascot + speech bubble */}
          <div className="pointer-events-none absolute inset-y-0 right-4 hidden w-[352px] md:block" aria-hidden="true">
            {/* Speech bubble */}
            <div className="absolute right-[154px] top-1/2 z-20 w-[176px] -translate-y-1/2 rounded-2xl rounded-br-sm bg-white px-3.5 py-3 shadow-[0_8px_28px_rgba(49,18,115,0.28)]">
              <p className="text-[13px] font-black leading-snug text-gray-900">
                Сайн уу!
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                Өнөөдөр шинэ зүйл сурахад хамгийн сайхан өдөр шүү! 🚀
              </p>
              {/* tail */}
              <div className="absolute -right-[8px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[8px] border-y-transparent border-l-white" />
            </div>
            <div className="absolute bottom-[-8px] right-1 z-10">
              <MascotImage
                variant="wave"
                alt=""
                size={188}
                priority
                className="animate-float"
                imageClassName="drop-shadow-[0_20px_42px_rgba(9,4,34,0.42)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS CARDS ── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((item) => (
          <div
            key={item.labelEn}
            className="rounded-2xl border border-border bg-white p-4 transition-all duration-100 hover:-translate-y-0.5 hover:shadow-md dark:bg-card"
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
          <h2 className="text-base font-bold text-foreground">Continue Learning</h2>
          <Link
            href="/student/courses"
            className="flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            View all <ArrowRight size={12} />
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
              Browse Courses <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgress.map(({ course }) => (
              <div
                key={course.id}
                className="group relative overflow-visible rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-md dark:bg-card"
                style={{ boxShadow: "var(--shadow-1)" }}
              >
                <div className="flex items-center gap-4 p-5 pr-[210px]">
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
                        badge="Course"
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
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                        <div className="h-full w-[15%] rounded-full bg-gradient-to-r from-violet-600 to-purple-400" />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">15%</span>
                    </div>
                    <Link
                      href={`/student/courses/${course.id}/learn`}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400"
                    >
                      Resume Course <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Mascot + speech bubble (right) */}
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
                  {/* Speech bubble */}
                  <div className="relative rounded-2xl rounded-b-2xl rounded-br-sm border border-border bg-white px-3 py-2.5 shadow-md dark:bg-card">
                    <p className="max-w-[136px] text-center text-[11px] font-semibold leading-snug text-foreground">
                      Үргэлжлүүлээд ахицаа нэмээрэй! 💪
                    </p>
                    <div className="absolute -bottom-[6px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-card" />
                  </div>
                  <MascotImage variant="book" size={88} className="animate-float" />
                </div>
              </div>
            ))}
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
            <h2 className="text-base font-bold text-foreground">Recommended For You</h2>
          </div>
          <Link
            href="/student/catalog"
            className="flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            Browse all <ArrowRight size={12} />
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
              const avgRating =
                course.reviews.length > 0
                  ? (
                      course.reviews.reduce((sum, r) => sum + r.rating, 0) /
                      course.reviews.length
                    ).toFixed(1)
                  : null;

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
                  <div className="relative flex min-w-0 flex-1 flex-col justify-between p-3.5 pr-[88px] sm:pr-[98px]">
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
                          <span className="text-[10px] text-muted-foreground">({course.reviews.length})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 text-muted-foreground">
                        <Users size={10} />
                        <span className="text-[10px]">{course._count.enrollments} хичээл</span>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 drop-shadow-[0_12px_24px_rgba(88,28,135,0.18)]">
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

      {/* ── EMPTY STATES SECTION ── */}
      <section>
        <h2 className="mb-4 text-base font-bold text-foreground">Хоосон байсан хэсгүүд</h2>
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
