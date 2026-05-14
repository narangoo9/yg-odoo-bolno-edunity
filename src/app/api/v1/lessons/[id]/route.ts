import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
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
          course: { select: { id: true, title: true } },
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

  return NextResponse.json({
    lesson: {
      ...lesson,
      sections: lesson.sections.map((section) => ({
        ...section,
        isCompleted: section.completions.length > 0,
        completions: undefined,
      })),
    },
  });
}
