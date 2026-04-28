import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Миний оюутнууд" };

export default async function InstructorStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { course: { instructorId: session.user.id } },
    orderBy: { enrolledAt: "desc" },
    include: {
      student: { select: { id: true, name: true, email: true, avatarUrl: true } },
      course:  { select: { title: true } },
    },
  });

  const studentMap = new Map<string, {
    student: { id: string; name: string; email: string; avatarUrl: string | null };
    enrollments: { course: { title: string }; status: string; enrolledAt: Date }[];
  }>();

  for (const enr of enrollments) {
    if (!studentMap.has(enr.student.id)) {
      studentMap.set(enr.student.id, { student: enr.student, enrollments: [] });
    }
    studentMap.get(enr.student.id)!.enrollments.push({
      course: enr.course, status: enr.status, enrolledAt: enr.enrolledAt,
    });
  }

  const students = Array.from(studentMap.values());

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Миний оюутнууд</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Нийт {students.length} оюутан</p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40">
          <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">Одоогоор оюутан бүртгүүлээгүй</p>
          <p className="text-xs text-muted-foreground mt-1">Курс нийтэлснийхээ дараа оюутнууд бүртгүүлнэ</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Оюутан</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Курсууд</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Төлөв</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Бүртгүүлсэн</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map(({ student, enrollments: enrs }) => {
                const latest = enrs[0];
                const completedCount = enrs.filter(e => e.status === "COMPLETED").length;
                return (
                  <tr key={student.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0 overflow-hidden">
                          {student.avatarUrl
                            ? <img src={student.avatarUrl} className="w-full h-full object-cover" alt="" />
                            : student.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{enrs.length} курс</p>
                      <p className="text-xs text-muted-foreground">{completedCount} дүүргэсэн</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <Badge variant={latest.status === "COMPLETED" ? "success" : "info"}>
                        {latest.status === "COMPLETED" ? "Дүүрсэн" : "Идэвхтэй"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(latest.enrolledAt)}
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
