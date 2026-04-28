import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { BookOpen, Users, Award, ArrowLeft, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/index";
import { PublishProgramButton } from "@/components/programs/PublishProgramButton";
import { AddCourseToProgram } from "@/components/programs/AddCourseToProgram";

export const metadata: Metadata = { title: "Программ удирдах" };

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const program = await db.program.findUnique({
    where: { id },
    include: {
      organization: true,
      courses: {
        include: { course: { include: { instructor: { select: { name: true } } } } },
        orderBy: { orderIndex: "asc" },
      },
      _count: { select: { enrollments: true, certificates: true } },
    },
  });

  if (!program) notFound();
  if (
    session.user.role !== "SUPER_ADMIN" &&
    program.organizationId !== session.user.organizationId
  ) {
    redirect("/org/programs");
  }

  // Available courses from same org not yet in program
  const existingCourseIds = program.courses.map((pc) => pc.courseId);
  const availableCourses = await db.course.findMany({
    where: {
      organizationId: program.organizationId,
      status: "PUBLISHED",
      id: { notIn: existingCourseIds },
    },
    select: { id: true, title: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link href="/org/programs" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{program.title}</h1>
          <p className="text-muted-foreground text-sm">{program.organization.name}</p>
        </div>
        <Badge
          variant={
            program.status === "PUBLISHED"
              ? "default"
              : program.status === "ARCHIVED"
              ? "outline"
              : "secondary"
          }
        >
          {program.status === "PUBLISHED"
            ? "Нийтлэгдсэн"
            : program.status === "ARCHIVED"
            ? "Архивлагдсан"
            : "Ноорог"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{program.courses.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Курс</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{program._count.enrollments}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Суралцагч</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{program._count.certificates}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Сертификат</p>
        </div>
      </div>

      {/* Courses in program */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Программын курсууд</h2>
          {program.isOrdered && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock size={12} />
              Дарааллаар
            </span>
          )}
        </div>

        {program.courses.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Курс нэмэгдээгүй байна
          </p>
        ) : (
          <ol className="space-y-2">
            {program.courses.map((pc, idx) => (
              <li
                key={pc.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-xl"
              >
                <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{pc.course.title}</p>
                  <p className="text-xs text-muted-foreground">{pc.course.instructor.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pc.isRequired ? (
                    <Badge variant="secondary" className="text-xs">Заавал</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Нэмэлт</Badge>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {availableCourses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <AddCourseToProgram programId={program.id} availableCourses={availableCourses} />
          </div>
        )}
      </div>

      {/* Certificate settings */}
      {(program.certificateTitle || program.certificateDescription) && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-500" />
            <h2 className="font-semibold text-foreground">Сертификатын тохиргоо</h2>
          </div>
          <p className="text-sm text-foreground font-medium">{program.certificateTitle}</p>
          {program.certificateDescription && (
            <p className="text-sm text-muted-foreground mt-1">{program.certificateDescription}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {program.status === "DRAFT" && (
        <PublishProgramButton
          programId={program.id}
          hasCourses={program.courses.length > 0}
        />
      )}
    </div>
  );
}
