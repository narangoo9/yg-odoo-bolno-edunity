import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/index";
import { getInstructorCourseStats } from "@/modules/analytics/infrastructure/queries";

export const metadata: Metadata = { title: "Миний курсууд" };

const statusConfig = {
  PUBLISHED:    { label: "Нийтлэгдсэн",   variant: "success"   as const },
  DRAFT:        { label: "Ноорог",         variant: "secondary" as const },
  ARCHIVED:     { label: "Архивласан",     variant: "outline"   as const },
  UNDER_REVIEW: { label: "Хянагдаж байна", variant: "warning"   as const },
};

export default async function InstructorCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const courses = await getInstructorCourseStats(session.user.id);

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Миний курсууд</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} курс нийт</p>
        </div>
        <Link href="/instructor/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/20">
          <Plus size={15} /> Шинэ курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40">
          <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <BookOpen size={24} className="text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">Курс байхгүй байна</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Анхны курсоо үүсгэж эхэл</p>
          <Link href="/instructor/courses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-2xl transition-colors">
            <Plus size={13} /> Шинэ курс үүсгэх
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Курс</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Оюутан</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Үнэлгээ</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Дүүргэлт</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => {
                const sc = statusConfig[course.status as keyof typeof statusConfig];
                return (
                  <tr key={course.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground line-clamp-1">{course.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.reviewCount} сэтгэгдэл</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Users size={13} className="text-violet-400" />
                        <span className="font-medium">{course.enrollmentCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="font-medium text-foreground">{course.averageRating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                            style={{ width: `${course.completionRate}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{course.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={sc?.variant ?? "outline"}>{sc?.label ?? course.status}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/instructor/courses/${course.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors">
                        Засах
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
