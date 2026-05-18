import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Plus, BookOpen, Users, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/index";

export const metadata: Metadata = { title: "Программ удирдах" };

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" }> = {
  DRAFT: { label: "Ноорог", variant: "secondary" },
  PUBLISHED: { label: "Нийтлэгдсэн", variant: "success" },
  ARCHIVED: { label: "Архивлагдсан", variant: "outline" },
};

export default async function OrgProgramsPage() {
  const session = await auth();
  if (!session?.user || !["COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/org");

  const programs = await db.program.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { courses: true, enrollments: true, certificates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Сургалтын программ</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Байгууллагын сертификат олгодог сургалтын зам
          </p>
        </div>
        <Button asChild>
          <Link href="/org/programs/new">
            <Plus size={16} className="mr-1.5" />
            Программ нэмэх
          </Link>
        </Button>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <BookOpen size={36} className="mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground font-medium">Программ байхгүй байна</p>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Эхний сургалтын программаа үүсгэнэ үү
          </p>
          <Button asChild size="sm">
            <Link href="/org/programs/new">
              <Plus size={14} className="mr-1" />
              Программ нэмэх
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => {
            const status = STATUS_LABELS[program.status] ?? STATUS_LABELS.DRAFT;
            return (
              <Link
                key={program.id}
                href={`/org/programs/${program.id}`}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-border hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground truncate">{program.title}</span>
                    <Badge variant={status.variant} className="text-xs shrink-0">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {program._count.courses} курс
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {program._count.enrollments} суралцагч
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={12} />
                      {program._count.certificates} сертификат
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
