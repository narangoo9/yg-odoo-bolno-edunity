import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCourseChatMessage,
  ensureCourseConversation,
  listCourseChatMessages,
} from "@/lib/chat/course-chat";
import { toChatUuid } from "@/lib/supabase/chat-identity";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  courseId: z.string().min(1),
  after: z.string().datetime().optional(),
});

const postSchema = z.object({
  conversationId: z.string().uuid(),
  courseId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

async function canAccessCourse(courseId: string, userId: string) {
  const [enrollment, course] = await Promise.all([
    db.enrollment.findFirst({
      where: {
        courseId,
        studentId: userId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      select: { id: true },
    }),
    db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
        instructor: { select: { id: true } },
        enrollments: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] } },
          select: { studentId: true },
          take: 50,
        },
      },
    }),
  ]);

  if (!course) return null;
  if (course.instructorId !== userId && !enrollment) return null;
  return course;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    conversationId: req.nextUrl.searchParams.get("conversationId"),
    courseId: req.nextUrl.searchParams.get("courseId"),
    after: req.nextUrl.searchParams.get("after") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await canAccessCourse(parsed.data.courseId, session.user.id);
  if (!course || parsed.data.conversationId !== toChatUuid(`course:${course.id}`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const messages = await listCourseChatMessages(
      parsed.data.conversationId,
      parsed.data.after,
    );
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/v1/messages error:", error);
    return NextResponse.json({ error: "Unable to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const course = await canAccessCourse(parsed.data.courseId, session.user.id);
  if (!course || parsed.data.conversationId !== toChatUuid(`course:${course.id}`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chatUserId = toChatUuid(session.user.id);

  try {
    await ensureCourseConversation({
      conversationId: parsed.data.conversationId,
      courseId: course.id,
      title: course.title,
      instructorUserId: course.instructor.id,
      memberChatUserIds: course.enrollments.map(enrollment => toChatUuid(enrollment.studentId)),
      currentChatUserId: chatUserId,
      currentRole: course.instructorId === session.user.id ? "instructor" : "member",
    });

    const message = await createCourseChatMessage({
      conversationId: parsed.data.conversationId,
      senderChatUserId: chatUserId,
      content: parsed.data.content,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST /api/v1/messages error:", error);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
