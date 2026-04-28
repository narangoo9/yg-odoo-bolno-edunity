import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MessagesClient } from "@/components/student/MessagesClient";

export const metadata: Metadata = { title: "Messages — EduNity" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

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

  const courseIds = enrollments.map((e) => e.course.id);

  const [dms, channelMessages] = await Promise.all([
    db.directMessage.findMany({
      where: { OR: [{ senderId: session.user.id }, { recipientId: session.user.id }] },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []),
    courseIds.length > 0
      ? db.comment.findMany({
          where: { contentType: "COURSE", contentId: { in: courseIds } },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
          take: 200,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const currentUser = myUser ?? {
    id: session.user.id,
    name: session.user.name ?? "You",
    avatarUrl: null as string | null,
  };

  return (
    <MessagesClient
      currentUserId={session.user.id}
      currentUser={currentUser}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enrollments={enrollments as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channelMessages={channelMessages as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dms={dms as any}
    />
  );
}
