import type { Metadata } from "next";
import Link from "next/link";
import {
  Search, Star, Users, Clock, Bookmark, ArrowRight,
} from "lucide-react";
import { getCourses } from "@/modules/courses/infrastructure/queries";
import { Badge } from "@/components/ui/index";
import { formatDuration, cn } from "@/lib/utils";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { MascotImage } from "@/components/brand/MascotImage";
import type { MascotVariant } from "@/components/brand/MascotImage";

export const revalidate = 60;
export const metadata: Metadata = { title: "Курс каталог" };

const levelLabels: Record<string, string> = {
  BEGINNER:     "Эхлэгч",
  INTERMEDIATE: "Дунд",
  ADVANCED:     "Дэвшилтэт",
  ALL_LEVELS:   "Бүх түвшин",
};
const levelColors: Record<string, "success" | "warning" | "destructive" | "info"> = {
  BEGINNER:     "success",
  INTERMEDIATE: "warning",
  ADVANCED:     "destructive",
  ALL_LEVELS:   "info",
};

function mascotForCourse(level: string, category?: string | null): MascotVariant {
  if (level === "BEGINNER") return "book";
  const cat = (category ?? "").toLowerCase();
  if (cat.includes("дизайн") || cat.includes("design") || cat.includes("ui")) return "thinking";
  if (cat.includes("дата") || cat.includes("data") || cat.includes("analytic")) return "fire";
  return "laptop";
}

interface PageProps {
  searchParams: Promise<{ search?: string; level?: string; page?: string; sortBy?: string }>;
}

export default async function StudentCatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const listing = await getCourses({
    search: sp.search,
    level: sp.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined,
    page,
    limit: 12,
    sortBy: (sp.sortBy as "newest" | "popular" | "rating") ?? "popular",
  }).catch(() => null);

  const courses    = listing?.courses ?? [];
  const pagination = listing?.pagination ?? {
    page, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  };
  const unavailable = listing === null;

  const filters = [
    {
      href:   `?${new URLSearchParams({ ...(sp.search ? { search: sp.search } : {}) })}`,
      label:  "Бүгд",
      active: !sp.level && (!sp.sortBy || sp.sortBy === "popular"),
    },
    {
      href:   `?${new URLSearchParams({ ...sp, sortBy: "popular" })}`,
      label:  "Алдартай",
      active: sp.sortBy === "popular" && !sp.level,
    },
    {
      href:   `?${new URLSearchParams({ ...sp, sortBy: "newest" })}`,
      label:  "Шинэ",
      active: sp.sortBy === "newest" && !sp.level,
    },
    {
      href:   `?${new URLSearchParams({ ...sp, level: "BEGINNER" })}`,
      label:  "Эхлэгч",
      active: sp.level === "BEGINNER",
    },
    {
      href:   `?${new URLSearchParams({ ...sp, level: "INTERMEDIATE" })}`,
      label:  "Дунд",
      active: sp.level === "INTERMEDIATE",
    },
    {
      href:   `?${new URLSearchParams({ ...sp, level: "ADVANCED" })}`,
      label:  "Дэвшилтэт",
      active: sp.level === "ADVANCED",
    },
  ];

  const featuredCourse = courses.length > 0 ? courses[0] : null;

  return (
    <div className="max-w-5xl animate-fade-up space-y-6">

      {/* ── HERO CARD ───────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
        style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #6d28d9 80%, #5b21b6 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 w-36 h-36 rounded-full bg-fuchsia-500/10 blur-2xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <p className="text-violet-200 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
              🎓 Суралцах боломж
            </p>
            <h1 className="text-[2rem] font-black text-white leading-tight mb-1.5">
              Курс Каталог
            </h1>
            <p className="text-violet-200/90 text-[13px] mb-5">
              Өөрт тохирох курсээ олж, шинэ ур чадвар эзэмшээрэй 🚀
            </p>

            {/* Stat pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: `${pagination.total > 0 ? pagination.total : "8"}+`, label: "курс байна",  icon: "📚", bg: "bg-violet-500/40" },
                { value: "6",    label: "сэдэв",      icon: "🎯", bg: "bg-white/10" },
                { value: "200+", label: "суралцагч",  icon: "👥", bg: "bg-indigo-500/30" },
                { value: "4.8",  label: "үнэлгээ",    icon: "⭐", bg: "bg-amber-400/25" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm ${s.bg}`}
                >
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-white font-black text-[15px]">{s.value}</span>
                  <span className="text-violet-200 text-[11px] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mascot + speech bubble */}
          <div className="shrink-0 hidden sm:flex flex-col items-end relative">
            <div className="absolute -top-3 right-[106px] bg-white rounded-2xl rounded-br-sm px-3 py-2 shadow-lg max-w-[148px] z-20">
              <p className="text-[10px] font-semibold text-gray-700 leading-snug">
                Өөрт хэрэгтэй мэдлэгээ эндээс олоорой! 🔍
              </p>
              <span className="absolute right-3 -bottom-1.5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-400/30 blur-2xl scale-150 animate-hero-glow" />
              <MascotImage
                variant="thinking"
                size={130}
                priority
                className="relative z-10 animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH + FILTERS ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            name="search"
            defaultValue={sp.search}
            type="search"
            placeholder="Юу сурах вэ?"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400/60 transition-all shadow-sm"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
                f.active
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200/50 dark:shadow-violet-900/30"
                  : "border border-border bg-card text-muted-foreground hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-600/30 dark:hover:bg-violet-500/15 dark:hover:text-violet-300",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── ERROR ───────────────────────────────────────────────────── */}
      {unavailable && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          Каталог ачаалахад алдаа гарлаа. Дата сангийн холболтыг шалгана уу.
        </div>
      )}

      {/* ── EMPTY ───────────────────────────────────────────────────── */}
      {courses.length === 0 && !unavailable ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-card py-16 text-center dark:border-violet-800/40">
          <MascotImage variant="thinking" size={80} className="mx-auto mb-4 animate-float" />
          <p className="text-sm font-semibold text-foreground mb-1">Илэрц олдсонгүй</p>
          <p className="text-xs text-muted-foreground mb-4">Өөр түлхүүр үг ашиглан хайж үзнэ үү</p>
          <Link
            href="?"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl transition-colors"
          >
            Бүгдийг харах <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <>
          {/* ── COURSE GRID ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-violet-300/60 dark:hover:border-violet-700/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 glow-card"
              >
                {/* Thumbnail area */}
                <div className="relative h-40 overflow-hidden bg-muted">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <LearningArtwork
                      title={course.title}
                      subtitle={course.instructor.name}
                      badge={course.category?.name ?? "Course"}
                      className="h-full w-full"
                    />
                  )}

                  {/* Top-left: level + category */}
                  <div className="absolute left-2 top-2 flex items-center gap-1 flex-wrap">
                    <Badge
                      variant={levelColors[course.level] ?? "info"}
                      className="shadow-sm text-[9px] py-0 leading-tight"
                    >
                      {levelLabels[course.level] ?? course.level}
                    </Badge>
                    {course.category && (
                      <span className="px-1.5 py-0.5 bg-black/35 backdrop-blur-sm rounded-full text-white text-[9px] font-bold uppercase tracking-wide">
                        {course.category.name}
                      </span>
                    )}
                  </div>

                  {/* Top-right: bookmark (reveals on hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-7 h-7 bg-white/85 dark:bg-black/55 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
                      <Bookmark size={13} className="text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>

                  {/* Bottom-right: mascot (fades when CTA overlay appears) */}
                  <div className="absolute -bottom-2 -right-1 transition-all duration-200 group-hover:opacity-0 group-hover:scale-90">
                    <MascotImage
                      variant={mascotForCourse(course.level, course.category?.name)}
                      size={44}
                      className="opacity-75"
                    />
                  </div>

                  {/* Hover: gradient overlay + CTA pill */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-3.5">
                    <span className="translate-y-2 group-hover:translate-y-0 transition-transform duration-200 bg-white text-violet-700 font-black text-[11px] px-4 py-1.5 rounded-xl shadow-lg">
                      Курс үзэх →
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <p className="mb-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-foreground">
                    {course.title}
                  </p>
                  <p className="mb-2.5 text-[11px] text-muted-foreground">{course.instructor.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={11} /> {course.enrollmentCount}
                    </span>
                    {course.averageRating > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {course.averageRating.toFixed(1)}
                      </span>
                    )}
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDuration(course.duration * 60)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── FEATURED / RECOMMENDED COURSE ───────────────────────── */}
          {featuredCourse && page === 1 && (
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star size={13} className="text-amber-500 fill-amber-400" />
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      Танд санал болгож буй
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground mb-0.5 line-clamp-1">
                    {featuredCourse.title}
                  </h3>
                  <p className="text-[12px] text-muted-foreground mb-1">
                    {featuredCourse.instructor.name}
                    {featuredCourse.category && ` · ${featuredCourse.category.name}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {featuredCourse.enrollmentCount} суралцагч
                    </span>
                    {featuredCourse.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {featuredCourse.averageRating.toFixed(1)} үнэлгээ
                      </span>
                    )}
                    <Badge
                      variant={levelColors[featuredCourse.level] ?? "info"}
                      className="text-[9px] leading-tight"
                    >
                      {levelLabels[featuredCourse.level] ?? featuredCourse.level}
                    </Badge>
                  </div>
                  <Link
                    href={`/courses/${featuredCourse.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-black text-white shadow-md shadow-violet-200/50 dark:shadow-violet-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
                  >
                    Курс дэлгэрэнгүй <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="shrink-0 hidden sm:block relative">
                  <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-2xl scale-150 animate-hero-glow" />
                  <MascotImage
                    variant="laptop"
                    size={100}
                    className="relative z-10 animate-float"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PAGINATION ──────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {pagination.hasPrev && (
            <Link
              href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-600/30 shadow-sm"
            >
              ← Өмнөх
            </Link>
          )}
          <span className="px-4 py-2 text-sm font-bold text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          {pagination.hasNext && (
            <Link
              href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-600/30 shadow-sm"
            >
              Дараах →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
