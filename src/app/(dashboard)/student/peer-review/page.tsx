import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PeerReviewClient } from "@/components/student/PeerReviewClient";
import { SectionTaskPeerReviewClient } from "@/components/student/SectionTaskPeerReviewClient";
import { FinalProjectPeerReviewClient } from "@/components/student/FinalProjectPeerReviewClient";
import { getFinalProjectReviewQueue } from "@/lib/learning/final-project";

export const metadata: Metadata = { title: "Хамтран дүгнэх" };

export default async function PeerReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect("/student");

  const [
    myCapstones,
    assignedReviews,
    pendingCapstones,
    mySectionTasks,
    assignedSectionTaskReviews,
    pendingSectionTasks,
    finalProjectQueue,
  ] = await Promise.all([
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

    db.courseSectionTaskSubmission.findMany({
      where: { studentId: session.user.id },
      include: {
        course: { select: { title: true } },
        section: { select: { title: true, order: true } },
        reviews: { select: { id: true, isCompleted: true, score: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 20,
    }),

    db.courseSectionTaskReview.findMany({
      where: { reviewerId: session.user.id, isCompleted: false },
      include: {
        submission: {
          include: {
            student: { select: { name: true, avatarUrl: true } },
            course: { select: { title: true } },
            section: { select: { title: true, order: true } },
            reviews: { select: { id: true, isCompleted: true, score: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    db.courseSectionTaskSubmission.findMany({
      where: {
        studentId: { not: session.user.id },
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        reviews: { none: { reviewerId: session.user.id } },
        course: { enrollments: { some: { studentId: session.user.id, status: "ACTIVE" } } },
      },
      include: {
        student: { select: { name: true, avatarUrl: true } },
        course: { select: { title: true } },
        section: { select: { title: true, order: true } },
        reviews: { select: { id: true, isCompleted: true, score: true } },
      },
      orderBy: { submittedAt: "asc" },
      take: 10,
    }),

    getFinalProjectReviewQueue(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <FinalProjectPeerReviewClient
        initialQueue={finalProjectQueue.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          demoUrl: item.demoUrl,
          githubUrl: item.githubUrl,
          status: item.status,
          reviewCount: item.reviews.length,
          student: item.student,
          course: item.course,
        }))}
      />
      <SectionTaskPeerReviewClient
        myTasks={mySectionTasks}
        assignedReviews={assignedSectionTaskReviews}
        pendingTasks={pendingSectionTasks}
      />
      <PeerReviewClient
        currentUserId={session.user.id}
        myCapstones={myCapstones}
        assignedReviews={assignedReviews}
        pendingCapstones={pendingCapstones}
      />
    </div>
  );
}
