import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, Plus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Байгууллагын курсууд" };

const statusConfig = {
  PUBLISHED: { label: "Нийтлэгдсэн", variant: "success" as const },
  DRAFT: { label: "Ноорог", variant: "secondary" as const },
  ARCHIVED: { label: "Архивласан", variant: "outline" as const },
  UNDER_REVIEW: { label: "Хянагдаж байна", variant: "warning" as const },
};

export default async function OrgCoursesPage() {
  const session = await auth();
  if (!session?.user || !["COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/org");
  }

  const courses = await db.course.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      currency: true,
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, certificates: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Байгууллагын курсууд</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} курс бүртгэлтэй</p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/20"
        >
          <Plus size={15} />
          Шинэ курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40">
          <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <BookOpen size={24} className="text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">Одоогоор курс алга байна</p>
          <p className="text-xs text-muted-foreground mt-1">Байгууллагын анхны курсыг үүсгээд эхэлнэ үү</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Курс</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Багш</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Суралцагч</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Сертификат</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Статус</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Үнэ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => {
                const status = statusConfig[course.status as keyof typeof statusConfig];

                return (
                  <tr key={course.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">{course.title}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-muted-foreground">{course.instructor.name}</td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Users size={13} className="text-violet-400" />
                        <span>{course._count.enrollments}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Award size={13} className="text-emerald-400" />
                        <span>{course._count.certificates}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={status?.variant ?? "outline"}>{status?.label ?? course.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-foreground">
                      {formatCurrency(Number(course.price), course.currency)}
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
