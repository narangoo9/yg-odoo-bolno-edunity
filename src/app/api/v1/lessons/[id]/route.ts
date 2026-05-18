import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  // Private endpoint: lesson content requires enrollment or course-management access.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      duration: true,
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: {
            select: {
              id: true,
              title: true,
              instructorId: true,
              organizationId: true,
            },
          },
        },
      },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          youtubeId: true,
          startSeconds: true,
          endSeconds: true,
          taskTitle: true,
          taskDescription: true,
          pdfUrl: true,
          resourceUrl: true,
          completions: {
            where: { studentId: session.user.id },
            select: { id: true, completedAt: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const course = lesson.module.course;
  const sameOrganization =
    Boolean(course.organizationId) && course.organizationId === session.user.organizationId;
  const canManage =
    session.user.role === "SUPER_ADMIN" ||
    course.instructorId === session.user.id ||
    (session.user.role === "COMPANY" && sameOrganization);

  if (!canManage) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: course.id,
        },
      },
      select: { status: true },
    });

    if (!enrollment || enrollment.status === "CANCELLED" || enrollment.status === "EXPIRED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    lesson: {
      ...lesson,
      module: {
        ...lesson.module,
        course: {
          id: course.id,
          title: course.title,
        },
      },
      sections: lesson.sections.map((section) => ({
        ...section,
        isCompleted: section.completions.length > 0,
        completions: undefined,
      })),
    },
  });
}
