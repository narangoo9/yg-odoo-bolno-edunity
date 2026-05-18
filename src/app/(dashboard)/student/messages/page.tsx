import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MessagesClient } from "@/components/student/MessagesClient";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toChatUuid } from "@/lib/supabase/chat-identity";

export const metadata: Metadata = { title: "Мессеж" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect("/student");

  const [enrollments, myUser] = await Promise.all([
    db.enrollment.findMany({
      where: { studentId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        course: {
          select: {
            id: true, title: true, thumbnailUrl: true,
            instructor: { select: { id: true, name: true, avatarUrl: true } },
            enrollments: {
              where: { status: { in: ["ACTIVE", "COMPLETED"] } },
              select: { student: { select: { id: true, name: true, avatarUrl: true } } },
              take: 20,
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 20,
    }).catch(() => []),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, avatarUrl: true },
    }).catch(() => null),
  ]);

  const currentUser = myUser ?? {
    id: session.user.id,
    name: session.user.name ?? "You",
    avatarUrl: null as string | null,
  };
  const currentChatUserId = toChatUuid(session.user.id);
  const enrollmentsWithChat = enrollments.map((enrollment) => ({
    ...enrollment,
    course: {
      ...enrollment.course,
      chatConversationId: toChatUuid(`course:${enrollment.course.id}`),
      instructor: {
        ...enrollment.course.instructor,
        chatUserId: toChatUuid(enrollment.course.instructor.id),
      },
      enrollments: enrollment.course.enrollments.map(({ student }) => ({
        student: {
          ...student,
          chatUserId: toChatUuid(student.id),
        },
      })),
    },
  }));

  const supabase = getSupabaseAdminClient();
  if (supabase && enrollmentsWithChat.length > 0) {
    const conversations = enrollmentsWithChat.map(({ course }) => ({
      id: course.chatConversationId,
      kind: "course",
      course_id: course.id,
      title: course.title,
      created_by: toChatUuid(course.instructor.id),
    }));
    await supabase.from("conversations").upsert(conversations, { onConflict: "id" });

    const members = new Map<string, { conversation_id: string; user_id: string; role: string }>();
    enrollmentsWithChat.forEach(({ course }) => {
      members.set(`${course.chatConversationId}:${currentChatUserId}`, {
        conversation_id: course.chatConversationId,
        user_id: currentChatUserId,
        role: "member",
      });
      members.set(`${course.chatConversationId}:${course.instructor.chatUserId}`, {
        conversation_id: course.chatConversationId,
        user_id: course.instructor.chatUserId,
        role: "instructor",
      });
      course.enrollments.forEach(({ student }) => {
        members.set(`${course.chatConversationId}:${student.chatUserId}`, {
          conversation_id: course.chatConversationId,
          user_id: student.chatUserId,
          role: "member",
        });
      });
    });
    await supabase.from("conversation_members").upsert(Array.from(members.values()), {
      onConflict: "conversation_id,user_id",
    });
  }

  return (
    <MessagesClient
      currentUserId={session.user.id}
      currentChatUserId={currentChatUserId}
      currentUser={{ ...currentUser, chatUserId: currentChatUserId }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enrollments={enrollmentsWithChat as any}
      channelMessages={[]}
      dms={[]}
    />
  );
}
