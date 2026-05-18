import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Search, BookOpen, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/index";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CourseApprovalActions } from "@/components/admin/CourseApprovalActions";

export const metadata: Metadata = { title: "Курс удирдлага" };

const statusConfig = {
  PUBLISHED: { label: "Нийтлэгдсэн", variant: "success" as const },
  DRAFT: { label: "Ноорог", variant: "secondary" as const },
  ARCHIVED: { label: "Архивласан", variant: "outline" as const },
  UNDER_REVIEW: { label: "Хянагдаж байна", variant: "warning" as const },
};

interface Props {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function AdminCoursesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 15;

  const where = {
    ...(sp.search && {
      OR: [
        { title: { contains: sp.search, mode: "insensitive" as const } },
        { instructor: { name: { contains: sp.search, mode: "insensitive" as const } } },
      ],
    }),
    ...(sp.status && { status: sp.status as "PUBLISHED" | "DRAFT" | "ARCHIVED" | "UNDER_REVIEW" }),
  };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        price: true,
        currency: true,
        status: true,
        createdAt: true,
        instructor: { select: { name: true, avatarUrl: true } },
        category: { select: { name: true } },
        _count: { select: { enrollments: true, reviews: true, modules: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  const courseIds = courses.map((c) => c.id);
  const ratingRows =
    courseIds.length > 0
      ? await db.review.groupBy({
          by: ["courseId"],
          _avg: { rating: true },
          where: { courseId: { in: courseIds } },
        })
      : [];
  const avgRatingByCourse = new Map(
    ratingRows.map((r) => [r.courseId, Number(r._avg.rating ?? 0)]),
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Бүх курсууд</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Нийт {total} курс</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Гарчиг, багшийн нэр..."
            className="pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-slate-300 w-64"
          />
        </form>
        <div className="flex gap-2">
          {[
            { v: "", l: "Бүгд" },
            { v: "PUBLISHED", l: "Нийтлэгдсэн" },
            { v: "DRAFT", l: "Ноорог" },
            { v: "UNDER_REVIEW", l: "Хянагдаж буй" },
            { v: "ARCHIVED", l: "Архивласан" },
          ].map((s) => (
            <a
              key={s.v}
              href={`?${new URLSearchParams({ ...(sp.search ? { search: sp.search } : {}), ...(s.v ? { status: s.v } : {}) })}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                (sp.status ?? "") === s.v
                  ? "bg-violet-600 text-white border-slate-900"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {s.l}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Курс</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Багш</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Үнэ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Оюутан</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Үнэлгээ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => {
              const sc = statusConfig[course.status];
              const avgRating = avgRatingByCourse.get(course.id) ?? 0;
              return (
                <tr key={course.id} className="hover:bg-muted transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-violet-600">
                            <BookOpen size={14} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course._count.modules} модуль · {formatDate(course.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
                        {course.instructor.name[0]}
                      </div>
                      <span className="text-foreground truncate">{course.instructor.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {Number(course.price) === 0 ? (
                      <span className="text-emerald-600 font-semibold text-xs">Үнэгүй</span>
                    ) : (
                      <span className="text-foreground font-medium">{formatCurrency(Number(course.price), course.currency)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-foreground">
                      <Users size={12} className="text-muted-foreground" />
                      {course._count.enrollments}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden xl:table-cell">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-foreground">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({course._count.reviews})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {course.status === "UNDER_REVIEW" ? (
                      <CourseApprovalActions courseId={course.id} />
                    ) : (
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        Дэлгэрэнгүй
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {total}-аас {(page - 1) * limit + 1}–{Math.min(page * limit, total)} харуулж байна
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                  className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-muted"
                >
                  ← Өмнөх
                </a>
              )}
              {page * limit < total && (
                <a
                  href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                  className="px-3 py-1 text-xs bg-card border border-border rounded hover:bg-muted"
                >
                  Дараах →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
