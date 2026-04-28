import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Users, Star, Clock, Globe, BarChart3,
  Play, Lock, Award, ArrowRight, Crown,
  Atom, Code2, Braces, Sparkles,
} from "lucide-react";
import { getCourseBySlug } from "@/modules/courses/infrastructure/queries";
import { EnrollButton } from "@/components/course/EnrollButton";
import { formatDuration } from "@/lib/utils";
import { hasActiveCourseAccess } from "@/lib/subscription-access";
import { Navbar } from "@/components/layout/Navbar";
import { LearningArtwork } from "@/components/course/LearningArtwork";

/* ── new section components ── */
import { CourseToolbar } from "@/components/course/CourseToolbar";
import { CourseLearningFeatures } from "@/components/course/CourseLearningFeatures";
import { CourseCurriculumPanel } from "@/components/course/CourseCurriculumPanel";
import { CourseInstructorCard } from "@/components/course/CourseInstructorCard";
import { CourseStudentReviews } from "@/components/course/CourseStudentReviews";
import { CourseMascotHelper } from "@/components/course/CourseMascotHelper";
import { CourseCertificateCard } from "@/components/course/CourseCertificateCard";
import { CoursePremiumBanner } from "@/components/course/CoursePremiumBanner";

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
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
            <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Course data is unavailable</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Check `DATABASE_URL` in `.env` and make sure PostgreSQL is running.
              </p>
              <div className="mt-6">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  Browse courses <ArrowRight size={14} />
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

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = course.modules.reduce(
    (s, m) => s + m.lessons.reduce((ss, l) => ss + (l.duration ?? 0), 0),
    0
  );
  const isEnrolled = !!course.enrollment;
  const hasCourseAccess = hasActiveCourseAccess(subscription?.plan, subscription?.status);
  const isUnlocked = isEnrolled || hasCourseAccess;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* ── Page-specific animation tokens ─────────────────────────── */}
      <style>{`
        @keyframes cdp-spark-a {
          0%,100%{transform:translateY(0) rotate(0deg);opacity:.8}
          50%{transform:translateY(-9px) rotate(13deg);opacity:1}
        }
        @keyframes cdp-spark-b {
          0%,100%{transform:translateY(0) rotate(0deg);opacity:.55}
          50%{transform:translateY(-7px) rotate(-11deg);opacity:.95}
        }
        @keyframes cdp-card-hover {
          from{box-shadow:0 4px 16px rgba(124,58,237,.08)}
        }
        .cdp-spark-a{animation:cdp-spark-a 2.9s ease-in-out infinite}
        .cdp-spark-b{animation:cdp-spark-b 3.3s ease-in-out infinite .5s}
        .cdp-spark-c{animation:cdp-spark-a 3.0s ease-in-out infinite 1.0s}
        .cdp-spark-d{animation:cdp-spark-b 2.8s ease-in-out infinite .3s}
        .enroll-card{transition:box-shadow .2s ease-out}
        .enroll-card:hover{box-shadow:0 28px 72px rgba(124,58,237,.22)}
        .cdp-btn{transition:transform .15s ease-out,background-color .15s ease,box-shadow .15s ease}
        .cdp-btn:hover{transform:scale(1.025)}
        .cdp-btn-outline{transition:background-color .15s ease,border-color .15s ease}
        .cdp-btn-outline:hover{background:rgba(255,255,255,.15)}
        @media(prefers-reduced-motion:reduce){
          .cdp-spark-a,.cdp-spark-b,.cdp-spark-c,.cdp-spark-d,
          .enroll-card,.cdp-btn,.cdp-btn-outline,
          .animate-float{animation:none!important;transition:none!important}
          .cdp-btn:hover,.enroll-card:hover{transform:none;box-shadow:none}
        }
      `}</style>

      <Navbar />

      {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
      <CourseToolbar
        courseTitle={course.title}
        categoryId={course.category?.id}
        categoryName={course.category?.name}
      />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg,#160B3A 0%,#3B1A9B 45%,#7C3AED 100%)" }}
      >
        {/* Background texture + glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow circles */}
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-8 right-1/4 w-56 h-56 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl" />
          {/* Small star dots */}
          {[
            "top-[18%] left-[20%]", "top-[10%] left-[55%]", "top-[60%] left-[8%]",
            "top-[75%] left-[40%]", "top-[30%] right-[8%]",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full bg-white/40 ${pos}`}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-12 lg:pb-16">
          {/* 3-col desktop grid / single-col mobile stack */}
          <div
            className="flex flex-col gap-8 lg:grid lg:items-end lg:gap-6"
            style={{ gridTemplateColumns: "1fr 224px 372px" }}
          >
            {/* ── LEFT: course info ── */}
            <div className="space-y-5 lg:pb-2">
              {course.category && (
                <Link
                  href={`/courses?categoryId=${course.category.id}`}
                  className="inline-flex items-center px-3.5 py-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest rounded-full border border-white/30 hover:bg-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-800"
                >
                  {course.category.name}
                </Link>
              )}

              <h1 className="text-2xl sm:text-[1.875rem] lg:text-[2.15rem] font-extrabold leading-snug tracking-tight">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="text-violet-200 text-sm sm:text-[15px] leading-relaxed max-w-lg">
                  {course.shortDescription}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-violet-200">
                {course.averageRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star size={14} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                    <strong className="text-white tabular-nums">{course.averageRating.toFixed(1)}</strong>
                    <span className="text-violet-300">({course._count.reviews} сэтгэгдэл)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-violet-300" aria-hidden="true" />
                  <span>{course._count.enrollments} оюутан</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-violet-300" aria-hidden="true" />
                  <span>{course.language.toUpperCase()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-violet-300" aria-hidden="true" />
                  <span>{levelLabel[course.level]}</span>
                </span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                  {course.instructor.avatarUrl ? (
                    <img src={course.instructor.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    course.instructor.name[0]
                  )}
                </div>
                <span className="text-sm text-violet-200">
                  Багш:{" "}
                  <span className="text-white font-semibold">{course.instructor.name}</span>
                </span>
              </div>

              {/* Tags */}
              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/10 text-violet-200 text-xs font-medium rounded-full border border-white/20 hover:bg-white/18 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hero CTA buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                {isEnrolled ? (
                  <Link
                    href={`/student/courses/${course.id}/learn`}
                    className="cdp-btn inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-800"
                  >
                    <Play size={15} fill="currentColor" aria-hidden="true" />
                    Үргэлжлүүлэх
                  </Link>
                ) : !session?.user ? (
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
                    className="cdp-btn inline-flex items-center gap-2 px-5 py-3 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl text-sm shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-800"
                  >
                    <Lock size={15} aria-hidden="true" />
                    Одоо бүртгүүлэх
                  </Link>
                ) : (
                  <div className="cdp-btn">
                    <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
                  </div>
                )}

                {course.previewVideoUrl && (
                  <a
                    href={course.previewVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cdp-btn-outline inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl text-sm border border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-800"
                  >
                    <Play size={14} aria-hidden="true" />
                    Танилцуулга үзэх
                  </a>
                )}
              </div>

              {/* Inline meta strip */}
              <p className="text-xs text-violet-300 flex flex-wrap items-center gap-2">
                <BookOpen size={12} aria-hidden="true" />
                <span>{totalLessons} хичээл</span>
                <span>·</span>
                <Clock size={12} aria-hidden="true" />
                <span>{totalDuration > 0 ? formatDuration(totalDuration) : "2ц 37м"}</span>
                <span>·</span>
                <Award size={12} aria-hidden="true" />
                <span>Сертификаттай</span>
              </p>

              {/* Progress bar (enrolled only) */}
              {isEnrolled && (
                <div className="max-w-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-violet-200 font-medium">Таны ахиц</span>
                    <span className="text-xs text-violet-300 tabular-nums">0%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* ── CENTER: mascot (desktop only) ── */}
            <div className="hidden lg:flex flex-col items-center justify-end relative pb-0 self-end">
              {/* Floating sparkle badges — SVG icons, no emoji */}
              <div className="absolute top-6 right-2 cdp-spark-a" aria-hidden="true">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
                  <Atom size={18} className="text-white" />
                </div>
              </div>
              <div className="absolute top-24 left-0 cdp-spark-b" aria-hidden="true">
                <div className="w-8 h-8 bg-amber-400/85 rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles size={15} className="text-white" />
                </div>
              </div>
              <div className="absolute bottom-16 right-1 cdp-spark-c" aria-hidden="true">
                <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                  <Braces size={16} className="text-white" />
                </div>
              </div>
              <div className="absolute bottom-6 left-2 cdp-spark-d" aria-hidden="true">
                <div className="w-7 h-7 bg-violet-300/40 rounded-full flex items-center justify-center">
                  <Code2 size={13} className="text-white" />
                </div>
              </div>

              {/* Mascot with glow base */}
              <div className="relative animate-float">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-violet-400/30 rounded-full blur-xl animate-hero-glow" aria-hidden="true" />
                <Image
                  src="/assets/mascot/mascot-laptop.png"
                  alt="EduNity mascot дэмжиж байна"
                  width={218}
                  height={218}
                  className="drop-shadow-2xl select-none relative z-10"
                  priority
                />
              </div>
            </div>

            {/* ── RIGHT: enrollment card ── */}
            <div className="self-start lg:sticky lg:top-[88px]">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden enroll-card">
                {/* Thumbnail / artwork */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#3B0764] to-[#7C3AED]">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <LearningArtwork
                      title={course.title}
                      subtitle={course.instructor.name}
                      badge={course.category?.name ?? "Course"}
                      className="h-full w-full"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
                      {course.category?.name ?? "Курс"}
                    </p>
                    <p className="text-xs font-semibold text-white leading-snug line-clamp-1">
                      {course.title}
                    </p>
                    <p className="text-[10px] text-violet-200 mt-0.5">{course.instructor.name}</p>
                  </div>
                  {course.previewVideoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <a
                        href={course.previewVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Танилцуулга видео үзэх"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        <Play size={16} className="ml-0.5 text-violet-700" fill="currentColor" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Premium notice */}
                  <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">
                      {isEnrolled ? "Course unlocked" : hasCourseAccess ? "Upgrade active" : "Premium required"}
                    </p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-900 leading-snug">
                      {isEnrolled
                        ? "Continue learning anytime"
                        : hasCourseAccess
                        ? "Unlock this course instantly"
                        : "Upgrade to watch every lesson"}
                    </p>
                    <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
                      {isEnrolled
                        ? "Your lesson player and progress tracking are ready."
                        : hasCourseAccess
                        ? "Your plan can unlock this full course with one click."
                        : "All lessons stay locked until you move to Premium or Pro."}
                    </p>
                  </div>

                  {/* Card CTA */}
                  {isEnrolled ? (
                    <Link
                      href={`/student/courses/${course.id}/learn`}
                      className="cdp-btn flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                    >
                      <Play size={15} fill="currentColor" aria-hidden="true" />
                      Үргэлжлүүлэх
                    </Link>
                  ) : !session?.user ? (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
                      className="cdp-btn flex items-center justify-center gap-2 w-full py-3.5 bg-[#1E0953] text-white font-bold rounded-xl hover:bg-[#2D1070] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                    >
                      <BookOpen size={15} aria-hidden="true" />
                      Одоо бүртгүүлэх
                    </Link>
                  ) : (
                    <div className="cdp-btn">
                      <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
                    </div>
                  )}

                  {/* Course meta list */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                    {[
                      { icon: BookOpen, text: `${totalLessons} хичээл` },
                      { icon: Clock,    text: totalDuration > 0 ? formatDuration(totalDuration) : "Хугацаа тооцогдоогүй" },
                      { icon: Award,    text: "Сертификат олгодог" },
                      { icon: Globe,    text: "Насан туршийн хандалт" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5 text-sm text-gray-500">
                        <Icon size={14} className="text-violet-500 shrink-0" aria-hidden="true" />
                        {text}
                      </div>
                    ))}
                  </div>

                  {/* Trust footnote */}
                  {!isUnlocked && (
                    <p className="mt-3 text-center text-[11px] text-gray-400 leading-relaxed">
                      Premium эсвэл Pro эрхтэй бол бүх хичээл нээгдэнэ.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEARNING FEATURES (overlaps hero bottom) ────────────────── */}
      {course.learningOutcomes.length > 0 && (
        <CourseLearningFeatures outcomes={course.learningOutcomes} />
      )}

      {/* ── MAIN CONTENT GRID ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="flex flex-col lg:grid lg:gap-8"
          style={{ gridTemplateColumns: "1fr 340px" }}
        >
          {/* ── LEFT: curriculum ── */}
          <CourseCurriculumPanel
            modules={course.modules}
            isUnlocked={isUnlocked}
            totalLessons={totalLessons}
          />

          {/* ── RIGHT: sidebar cards ── */}
          <div className="mt-8 lg:mt-0 space-y-5">
            <CourseInstructorCard
              name={course.instructor.name}
              avatarUrl={course.instructor.avatarUrl}
              bio={course.instructor.bio}
            />
            <CourseStudentReviews
              reviews={course.reviews}
              totalCount={course._count.reviews}
            />
            <CourseMascotHelper />
            <CourseCertificateCard />
          </div>
        </div>
      </div>

      {/* ── PREMIUM BANNER ───────────────────────────────────────────── */}
      <CoursePremiumBanner />

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E9DFFF] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© 2024 EduNity. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="hover:text-gray-600 transition-colors focus:outline-none focus-visible:underline focus-visible:text-gray-700"
            >
              Нууцлалын бодлого
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-600 transition-colors focus:outline-none focus-visible:underline focus-visible:text-gray-700"
            >
              Үйлчилгээний нөхцөл
            </Link>
          </div>
        </div>
      </footer>

      {/* ── MOBILE STICKY BOTTOM CTA (hidden on sm+) ────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-violet-200 px-4 py-3 shadow-[0_-4px_24px_rgba(124,58,237,0.12)]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs text-gray-500 leading-tight">
            {isEnrolled
              ? "Бүртгэлтэй"
              : isUnlocked
              ? "Нэвтрэх эрхтэй"
              : "Premium шаардлагатай"}
          </span>
          <span className="text-[11px] text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
            {totalLessons} хичээл
          </span>
        </div>

        {isEnrolled ? (
          <Link
            href={`/student/courses/${course.id}/learn`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Play size={14} fill="currentColor" aria-hidden="true" />
            Үргэлжлүүлэх
          </Link>
        ) : !session?.user ? (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-bold rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Crown size={14} aria-hidden="true" />
            Одоо бүртгүүлэх
          </Link>
        ) : (
          <EnrollButton courseId={course.id} hasCourseAccess={hasCourseAccess} />
        )}
      </div>

      {/* Bottom padding so sticky CTA doesn't cover footer on mobile */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
