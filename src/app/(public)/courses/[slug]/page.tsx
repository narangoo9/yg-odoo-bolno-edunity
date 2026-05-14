import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Clock, Award, Play, Lock, BarChart3, ArrowRight, Crown,
} from "lucide-react";
import { getCourseBySlug, getCourseProgressSummary } from "@/modules/courses/infrastructure/queries";
import { EnrollButton } from "@/components/course/EnrollButton";
import { formatDuration } from "@/lib/utils";
import { hasActiveCourseAccess } from "@/lib/subscription-access";
import { LearningArtwork } from "@/components/course/LearningArtwork";

import { CourseDetailNavbar } from "@/components/course/CourseDetailNavbar";
import { LearningOutcomesCompact } from "@/components/course/LearningOutcomesCompact";
import { CourseCurriculumPanel } from "@/components/course/CourseCurriculumPanel";
import { CourseInstructorCard } from "@/components/course/CourseInstructorCard";
import { CourseStudentReviews } from "@/components/course/CourseStudentReviews";
import { CourseMascotHelper } from "@/components/course/CourseMascotHelper";
import { CourseCertificateCard } from "@/components/course/CourseCertificateCard";
import { CoursePremiumBanner } from "@/components/course/CoursePremiumBanner";
import { CourseProgressCard } from "@/components/course/CourseProgressCard";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) return { title: "Курс олдсонгүй" };
  return {
    title: course.title,
    description: course.shortDescription ?? course.description.slice(0, 160),
  };
}

const levelLabel: Record<string, string> = {
  BEGINNER: "Эхлэгч",
  INTERMEDIATE: "Дунд",
  ADVANCED: "Дэвшилтэт",
  ALL_LEVELS: "Бүх түвшин",
};

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth().catch(() => null);
  let catalogUnavailable = false;

  const [course, subscription] = await Promise.all([
    getCourseBySlug(slug, session?.user.id).catch(() => {
      catalogUnavailable = true;
      return null;
    }),
    session?.user?.id
      ? db.subscription.findUnique({
          where: { userId: session.user.id },
          select: { plan: true, status: true },
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!course) {
    if (catalogUnavailable) {
      return (
        <div className="min-h-screen bg-[#F5F3FF] dark:bg-[#0A0714]">
          <CourseDetailNavbar />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
            <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Курсийн мэдээлэл ачааллагдсангүй</h1>
              <p className="mt-3 text-sm text-muted-foreground">Мэдээллийн сан холбогдоогүй байна. Дахин оролдоно уу.</p>
              <div className="mt-6">
                <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500">
                  Курсууд руу буцах <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    notFound();
  }

  if (course.status !== "PUBLISHED") notFound();

  const totalLessons =
    course.sourceType === "YOUTUBE"
      ? course.sections.length
      : course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = course.modules.reduce(
    (s, m) => s + m.lessons.reduce((ss, l) => ss + (l.duration ?? 0), 0),
    0
  );
  const isEnrolled = !!course.enrollment;
  const hasCourseAccess = hasActiveCourseAccess(subscription?.plan, subscription?.status);
  const isUnlocked = isEnrolled || hasCourseAccess;

  const progressSummary =
    isEnrolled && session?.user?.id
      ? await getCourseProgressSummary(session.user.id, course.id).catch(() => null)
      : null;
  const progressPct = progressSummary?.percentage ?? 0;
  const completedCount = progressSummary?.completedCount ?? 0;
  const completedLessonIds = progressSummary?.completedLessonIds ?? [];
  const currentLesson = progressSummary?.currentLesson ?? null;
  const effectiveTotalLessons = progressSummary?.totalLessons || totalLessons;

  const thumb = course.coverImage ?? course.thumbnailUrl;
  const durationLabel = totalDuration > 0 ? formatDuration(totalDuration) : "2ц 37м";

  return (
    <div className="min-h-screen bg-[#F5F3FF] dark:bg-[#0A0714]">

      {/* ── MINIMAL NAVBAR ─────────────────────────────────────── */}
      <CourseDetailNavbar />

      {/* ── COMPACT HERO ───────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#100722 0%,#1E0A3C 35%,#3B1A9B 70%,#6D28D9 100%)" }}
      >
        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
          <div className="grid lg:grid-cols-[1fr_332px] gap-6 items-start">

            {/* ── LEFT: course info ─────────────────────────────── */}
            <div className="space-y-3.5 lg:py-1">

              {/* Category pill */}
              {course.category && (
                <Link
                  href={`/courses?categoryId=${course.category.id}`}
                  className="inline-flex items-center px-3 py-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.18em] rounded-full border border-white/25 hover:bg-white/25 transition-colors"
                >
                  {course.category.name}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Short description */}
              {course.shortDescription && (
                <p className="text-violet-200 text-sm leading-relaxed max-w-lg">
                  {course.shortDescription}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-violet-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-violet-400" />
                  <span className="text-white font-medium">{totalLessons}</span> хичээл
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-violet-400" />
                  <span className="text-white font-medium">{durationLabel}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={13} className="text-violet-400" />
                  <span className="text-white font-medium">{levelLabel[course.level]}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Award size={13} className="text-violet-400" />
                  <span className="text-white font-medium">Сертификат</span>
                </span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {course.instructor.avatarUrl
                    ? <img src={course.instructor.avatarUrl} className="w-full h-full object-cover" alt="" />
                    : course.instructor.name[0]}
                </div>
                <span className="text-sm text-violet-200">
                  Багш: <span className="text-white font-semibold">{course.instructor.name}</span>
                </span>
              </div>

              {/* Tags */}
              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 bg-white/10 text-violet-200 text-xs rounded-full border border-white/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2.5 pt-0.5">
                {isEnrolled ? (
                  <Link
                    href={`/student/courses/${course.id}/learn`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-violet-900/30 transition-all hover:scale-[1.02]"
                  >
                    <Play size={14} fill="currentColor" />
                    Үргэлжлүүлэх
                  </Link>
                ) : !session?.user ? (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl text-sm shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <Lock size={14} />
                    Одоо бүртгүүлэх
                  </Link>
                ) : (
                  <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
                )}

                {course.previewVideoUrl && (
                  <a
                    href={course.previewVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/18 text-white font-semibold rounded-xl text-sm border border-white/25 backdrop-blur-sm transition-all"
                  >
                    <Play size={13} />
                    Танилцуулга үзэх
                  </a>
                )}
              </div>
            </div>

            {/* ── RIGHT: compact enrollment card ───────────────── */}
            <div className="w-full">
              <div className="bg-white dark:bg-[#120E20] rounded-2xl shadow-2xl overflow-hidden border border-white/10">

                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#3B0764] to-[#6D28D9]">
                  {thumb ? (
                    <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <LearningArtwork
                      title={course.title}
                      subtitle={course.instructor.name}
                      badge={course.category?.name ?? "Course"}
                      className="h-full w-full"
                    />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Play button */}
                  {course.previewVideoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <a
                        href={course.previewVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        aria-label="Танилцуулга видео"
                      >
                        <Play size={15} className="ml-0.5 text-violet-700" fill="currentColor" />
                      </a>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isEnrolled
                        ? "bg-emerald-500 text-white"
                        : hasCourseAccess
                        ? "bg-violet-500 text-white"
                        : "bg-white/20 text-white backdrop-blur-sm border border-white/30"
                    }`}>
                      {isEnrolled ? "Course Unlocked" : hasCourseAccess ? "Upgrade Active" : "Premium Required"}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* State text */}
                  <div>
                    <p className="font-bold text-[#111827] dark:text-white text-[15px] leading-snug">
                      {isEnrolled ? "Continue learning" : hasCourseAccess ? "Unlock this course" : "Upgrade to watch every lesson"}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                      {isEnrolled
                        ? "Your lesson player and progress tracking are ready."
                        : hasCourseAccess
                        ? "Your plan can unlock this full course with one click."
                        : "All lessons stay locked until you upgrade to Premium or Pro."}
                    </p>
                  </div>

                  {/* Progress bar (enrolled) */}
                  {isEnrolled && (
                    <div>
                      <div className="h-1.5 bg-[#E5E7EB] dark:bg-[#1E1B2E] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[11px] text-violet-600 dark:text-violet-400 font-medium tabular-nums">
                        {progressPct}%
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  {isEnrolled ? (
                    <>
                      <Link
                        href={`/student/courses/${course.id}/learn`}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.35)] focus:outline-none"
                      >
                        <Play size={14} fill="currentColor" />
                        Үргэлжлүүлэх
                      </Link>
                      <p className="text-center text-xs text-[#9CA3AF]">
                        {completedCount} / {effectiveTotalLessons} хичээл дууссан
                      </p>
                    </>
                  ) : !session?.user ? (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all focus:outline-none"
                    >
                      <BookOpen size={14} />
                      Одоо бүртгүүлэх
                    </Link>
                  ) : (
                    <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
                  )}

                  {/* Meta strip */}
                  {!isUnlocked && (
                    <p className="text-center text-[11px] text-[#9CA3AF]">
                      Premium эсвэл Pro эрхтэй бол бүх хичээл нээгдэнэ.
                    </p>
                  )}

                  {/* Course stats row */}
                  <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E1B2E] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="flex items-center gap-1"><BookOpen size={11} className="text-violet-500" /> {totalLessons} хичээл</span>
                    <span className="flex items-center gap-1"><Clock size={11} className="text-violet-500" /> {durationLabel}</span>
                    <span className="flex items-center gap-1"><Award size={11} className="text-violet-500" /> Сертификат</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6">

        {/* Learning outcomes compact */}
        {course.learningOutcomes.length > 0 && (
          <LearningOutcomesCompact outcomes={course.learningOutcomes} />
        )}

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-[1fr_332px] gap-6">

          {/* ── LEFT: curriculum ─────────────────────────────── */}
          {course.modules.length > 0 ? (
            <CourseCurriculumPanel
              modules={course.modules}
              isUnlocked={isUnlocked}
              totalLessons={totalLessons}
              completedLessonIds={completedLessonIds}
              activeLessonId={currentLesson?.id}
            />
          ) : course.sections.length > 0 ? (
            <CourseCurriculumPanel
              modules={(() => {
                const CHUNK = 10;
                const groups: {
                  id: string;
                  title: string;
                  lessons: {
                    id: string;
                    title: string;
                    duration: number | null;
                    startTimeSeconds: number | null;
                    orderIndex: number;
                  }[];
                }[] = [];
                for (let i = 0; i < course.sections.length; i += CHUNK) {
                  const chunk = course.sections.slice(i, i + CHUNK);
                  groups.push({
                    id: `part-${i}`,
                    title: `Chapter ${Math.floor(i / CHUNK) + 1}`,
                    lessons: chunk.map((s) => ({
                      id: s.id,
                      title: s.title,
                      duration: s.endSeconds ? s.endSeconds - s.startSeconds : null,
                      startTimeSeconds: s.startSeconds,
                      orderIndex: s.order,
                    })),
                  });
                }
                return groups;
              })()}
              isUnlocked={isUnlocked}
              totalLessons={course.sections.length}
            />
          ) : null}

          {/* ── RIGHT: sticky sidebar ────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-[88px] self-start">
            {isEnrolled && progressSummary && (
              <CourseProgressCard
                courseId={course.id}
                thumbnailUrl={course.thumbnailUrl}
                coverImage={course.coverImage}
                courseTitle={course.title}
                currentLessonTitle={currentLesson?.title}
                progressPercent={progressPct}
                completedCount={completedCount}
                totalLessons={effectiveTotalLessons}
              />
            )}
            <CourseInstructorCard
              name={course.instructor.name}
              avatarUrl={course.instructor.avatarUrl}
              bio={course.instructor.bio}
              channelUrl={
                course.sourceType === "YOUTUBE"
                  ? `https://www.youtube.com/@${course.instructor.name.toLowerCase().replace(/\s+/g, "")}`
                  : undefined
              }
            />
            <CourseCertificateCard />
            <CourseMascotHelper />
            {course._count.reviews > 0 && (
              <CourseStudentReviews
                reviews={course.reviews}
                totalCount={course._count.reviews}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── PREMIUM BANNER ─────────────────────────────────────── */}
      <CoursePremiumBanner />

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7EB] dark:border-[#1E1B2E] bg-white dark:bg-[#0D0720]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9CA3AF]">
          <p>© 2024 EduNity. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#6B7280] transition-colors">Нууцлалын бодлого</Link>
            <Link href="/terms" className="hover:text-[#6B7280] transition-colors">Үйлчилгээний нөхцөл</Link>
          </div>
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 dark:bg-[#0D0720]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#1E1B2E] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            {isEnrolled ? "Бүртгэлтэй" : isUnlocked ? "Нэвтрэх эрхтэй" : "Premium шаардлагатай"}
          </span>
          <span className="text-[11px] text-violet-600 font-semibold bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-700">
            {totalLessons} хичээл
          </span>
        </div>
        {isEnrolled ? (
          <Link
            href={`/student/courses/${course.id}/learn`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-bold rounded-xl text-sm"
          >
            <Play size={14} fill="currentColor" />
            Үргэлжлүүлэх
          </Link>
        ) : !session?.user ? (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-bold rounded-xl text-sm"
          >
            <Crown size={14} />
            Одоо бүртгүүлэх
          </Link>
        ) : (
          <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
        )}
      </div>
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
