import type { Metadata } from "next";
import Link from "next/link";
import { Search, Filter, BookOpen, Star, Users, Clock, Lock } from "lucide-react";
import { getCourses } from "@/modules/courses/infrastructure/queries";
import { Badge } from "@/components/ui/index";
import { formatDuration } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { LearningArtwork } from "@/components/course/LearningArtwork";

export const revalidate = 60;

export const metadata: Metadata = { title: "Курсууд" };

const levelLabels = {
  BEGINNER: "Эхлэгч",
  INTERMEDIATE: "Дунд",
  ADVANCED: "Дэвшилтэт",
  ALL_LEVELS: "Бүх түвшин",
};

const levelColors = {
  BEGINNER: "success" as const,
  INTERMEDIATE: "warning" as const,
  ADVANCED: "destructive" as const,
  ALL_LEVELS: "info" as const,
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    level?: string;
    page?: string;
    sortBy?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const listing = await getCourses({
    search: sp.search,
    level: sp.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" | undefined,
    page,
    limit: 12,
    sortBy: (sp.sortBy as "newest" | "popular" | "rating") ?? "popular",
  }).catch(() => null);

  const courses = listing?.courses ?? [];
  const pagination = listing?.pagination ?? {
    page,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
  const catalogUnavailable = listing === null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-violet-950 via-purple-950 to-[#09090b] px-4 py-14 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-violet-400 text-xs font-semibold tracking-widest uppercase mb-3">Каталог</p>
          <h1 className="mb-3 text-4xl font-black tracking-tight">Курс хайх</h1>
          <p className="mb-7 text-sm text-muted-foreground">
            {pagination.total}+ курс байна. Өөртөө тохирохыг ол.
          </p>
          <div className="relative mx-auto max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <form>
              <input
                name="search"
                defaultValue={sp.search}
                type="search"
                placeholder="Юу сурах вэ?"
                className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 backdrop-blur-sm"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {catalogUnavailable && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Course data is unavailable. Check <code className="font-mono">DATABASE_URL</code> in <code className="font-mono">.env</code>.
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center gap-2.5 overflow-x-auto pb-2">
          <Filter size={14} className="shrink-0 text-violet-400" />
          {[
            { href: `?${new URLSearchParams({ ...(sp.search ? { search: sp.search } : {}) })}`, label: "Бүгд" },
            { href: `?${new URLSearchParams({ ...sp, sortBy: "popular" })}`, label: "Алдартай" },
            { href: `?${new URLSearchParams({ ...sp, sortBy: "newest" })}`, label: "Шинэ" },
            { href: `?${new URLSearchParams({ ...sp, level: "BEGINNER" })}`, label: "Эхлэгч" },
            { href: `?${new URLSearchParams({ ...sp, level: "INTERMEDIATE" })}`, label: "Дунд" },
            { href: `?${new URLSearchParams({ ...sp, level: "ADVANCED" })}`, label: "Дэвшилтэт" },
          ].map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-violet-100 dark:hover:bg-violet-500/15 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-600/30"
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <p className="mb-5 text-sm text-muted-foreground">
          {pagination.total} курс олдлоо{sp.search && ` — "${sp.search}"`}
        </p>

        {courses.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
              <BookOpen size={28} className="text-violet-500" />
            </div>
            <p className="text-muted-foreground font-medium">Илэрц олдсонгүй</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Өөр түлхүүр үг ашиглан хайж үзнэ үү</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {pagination.hasPrev && (
              <Link
                href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-600/30 transition-colors"
              >
                ← Өмнөх
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {page} / {pagination.totalPages}
            </span>
            {pagination.hasNext && (
              <Link
                href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-600/30 transition-colors"
              >
                Дараах →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Awaited<ReturnType<typeof getCourses>>["courses"][number] }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="glow-card group overflow-hidden rounded-2xl border border-border bg-card transition-all"
    >
      <div className="relative h-36 overflow-hidden bg-violet-100 dark:bg-violet-900/20">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
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
        <div className="absolute left-2 top-2">
          <Badge variant={levelColors[course.level]}>{levelLabels[course.level]}</Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {course.title}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">{course.instructor.name}</p>

        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={11} />{course.enrollmentCount}
          </span>
          {course.averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {course.averageRating.toFixed(1)}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock size={11} />{formatDuration(course.duration * 60)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-violet-700 dark:text-violet-300">
            <Lock size={12} />
            Locked
          </span>
          {course.category && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{course.category.name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
