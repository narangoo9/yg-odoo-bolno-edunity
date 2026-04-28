import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PeerReviewClient } from "@/components/student/PeerReviewClient";

export const metadata: Metadata = { title: "Peer Review — EduNity" };

export default async function PeerReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

  const [myCapstones, assignedReviews, pendingCapstones] = await Promise.all([
    // My submitted capstones and their review status
    db.capstone.findMany({
      where: { studentId: session.user.id },
      include: {
        course: { select: { id: true, title: true, thumbnailUrl: true } },
        reviews: {
          select: { id: true, reviewerId: true, score: true, feedback: true, isCompleted: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Reviews assigned to me (I need to grade these)
    db.capstoneReview.findMany({
      where: { reviewerId: session.user.id, isCompleted: false },
      include: {
        capstone: {
          include: {
            student: { select: { name: true, avatarUrl: true } },
            course: { select: { id: true, title: true, thumbnailUrl: true } },
          },
        },
      },
    }),

    // Capstones awaiting peer review (not mine, in courses I'm enrolled in)
    db.capstone.findMany({
      where: {
        status: "UNDER_REVIEW",
        studentId: { not: session.user.id },
        reviews: {
          none: { reviewerId: session.user.id },
        },
        course: {
          enrollments: { some: { studentId: session.user.id } },
        },
      },
      include: {
        student: { select: { name: true, avatarUrl: true } },
        course: { select: { id: true, title: true } },
        reviews: { select: { id: true, isCompleted: true, reviewerId: true, score: true, feedback: true } },
      },
      take: 10,
    }),
  ]);

  return (
    <PeerReviewClient
      currentUserId={session.user.id}
      myCapstones={myCapstones}
      assignedReviews={assignedReviews}
      pendingCapstones={pendingCapstones}
    />
  );
}
