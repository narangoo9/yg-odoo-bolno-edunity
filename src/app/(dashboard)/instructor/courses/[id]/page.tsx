import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Eye, Settings, Share2 } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { CourseEditor } from "@/components/course/CourseEditor";

interface Props { params: Promise<{ id: string }> }

const statusConfig = {
  PUBLISHED: { label: "Нийтлэгдсэн", variant: "success" as const },
  DRAFT: { label: "Ноорог", variant: "secondary" as const },
  ARCHIVED: { label: "Архивласан", variant: "outline" as const },
  UNDER_REVIEW: { label: "Хянагдаж байна", variant: "warning" as const },
};

export default async function CourseEditorPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: { sections: { orderBy: { order: "asc" } } },
          },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) notFound();
  const canAccess =
    course.instructorId === session.user.id ||
    session.user.role === "SUPER_ADMIN" ||
    (session.user.role === "ORG_ADMIN" &&
      course.organizationId === session.user.organizationId);
  if (!canAccess) redirect("/instructor/courses");

  const sc = statusConfig[course.status];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <Link
          href="/instructor/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft size={14} /> Бүх курс руу
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={sc.variant}>{sc.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {course._count.enrollments} оюутан · {course._count.reviews} сэтгэгдэл
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{course.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {course.status === "PUBLISHED" && (
              <Link
                href={`/courses/${course.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-xl hover:bg-muted"
              >
                <Eye size={14} /> Урьдчилан үзэх
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <CourseEditor
        courseId={course.id}
        status={course.status}
        thumbnailUrl={course.thumbnailUrl}
        modules={course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          orderIndex: m.orderIndex,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            type: l.type,
            duration: l.duration,
            contentUrl: l.contentUrl,
            videoType: l.videoType,
            videoUrl: l.videoUrl,
            videoProvider: l.videoProvider,
            sectionId: l.sectionId,
            startTimeSeconds: l.startTimeSeconds,
            endTimeSeconds: l.endTimeSeconds,
            sourceCreditName: l.sourceCreditName,
            sourceCreditUrl: l.sourceCreditUrl,
            isFree: l.isFree,
            orderIndex: l.orderIndex,
            sections: [],
          })),
        }))}
      />
    </div>
  );
}
