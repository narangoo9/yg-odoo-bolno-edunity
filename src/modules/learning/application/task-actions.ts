"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { XpAction } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueCourseCertificateIfEligible } from "@/lib/learning/certificates";
import { awardXP } from "@/modules/gamification/application/gamification-service";

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string().min(10),
  rubricScores: z.record(z.number()).optional(),
});

export type SubmitSectionTaskReviewInput = z.infer<typeof reviewSchema>;

export async function assignSectionTaskReview(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Нэвтрэх шаардлагатай" };

  const submission = await db.courseSectionTaskSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      studentId: true,
      courseId: true,
      status: true,
      course: {
        select: {
          enrollments: {
            where: { studentId: session.user.id, status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!submission) return { error: "Task олдсонгүй" };
  if (submission.studentId === session.user.id) return { error: "Өөрийн task-ийг review хийх боломжгүй" };
  if (submission.course.enrollments.length === 0) return { error: "Энэ course-д бүртгэлгүй байна" };
  if (submission.status === "GRADED") return { error: "Энэ task аль хэдийн үнэлэгдсэн байна" };

  await db.courseSectionTaskReview.upsert({
    where: {
      submissionId_reviewerId: { submissionId, reviewerId: session.user.id },
    },
    create: { submissionId, reviewerId: session.user.id },
    update: {},
  });

  await db.courseSectionTaskSubmission.updateMany({
    where: { id: submissionId, status: "SUBMITTED" },
    data: { status: "UNDER_REVIEW" },
  });

  revalidatePath("/student/peer-review");
  return { success: true };
}

export async function submitSectionTaskReview(input: SubmitSectionTaskReviewInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Нэвтрэх шаардлагатай" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { submissionId, score, feedback, rubricScores } = parsed.data;

  const review = await db.courseSectionTaskReview.findUnique({
    where: { submissionId_reviewerId: { submissionId, reviewerId: session.user.id } },
    include: {
      submission: { select: { studentId: true, courseId: true, sectionId: true, status: true } },
    },
  });

  if (!review) return { error: "Review хийх эрхгүй байна" };
  if (review.isCompleted) return { error: "Энэ review аль хэдийн дууссан" };
  if (review.submission.status === "GRADED") return { error: "Энэ task аль хэдийн үнэлэгдсэн" };

  const graded = await db.$transaction(async (tx) => {
    await tx.courseSectionTaskReview.update({
      where: { submissionId_reviewerId: { submissionId, reviewerId: session.user.id } },
      data: { score, feedback, rubricScores, isCompleted: true, completedAt: new Date() },
    });

    const reviews = await tx.courseSectionTaskReview.findMany({ where: { submissionId } });
    const completed = reviews.filter((item) => item.isCompleted && item.score !== null);
    const shouldGrade = completed.length > 0 && completed.length === reviews.length;

    if (!shouldGrade) {
      await tx.courseSectionTaskSubmission.update({
        where: { id: submissionId },
        data: { status: "UNDER_REVIEW" },
      });
      return false;
    }

    const avgScore = completed.reduce((sum, item) => sum + (item.score ?? 0), 0) / completed.length;

    await tx.courseSectionTaskSubmission.update({
      where: { id: submissionId },
      data: {
        status: "GRADED",
        score: avgScore,
        feedback: completed.map((item) => item.feedback).filter(Boolean).join("\n\n"),
        gradedAt: new Date(),
      },
    });

    await tx.course_section_task_states.upsert({
      where: {
        userId_sectionId: {
          userId: review.submission.studentId,
          sectionId: review.submission.sectionId,
        },
      },
      create: {
        userId: review.submission.studentId,
        courseId: review.submission.courseId,
        sectionId: review.submission.sectionId,
        state: "completed",
        completedAt: new Date(),
      },
      update: { state: "completed", completedAt: new Date() },
    });

    return true;
  });

  await awardXP(session.user.id, XpAction.PEER_REVIEW_COMPLETE, submissionId).catch(() => null);

  let certificate = null;
  if (graded) {
    await awardXP(review.submission.studentId, XpAction.TASK_COMPLETE, submissionId).catch(() => null);
    const result = await issueCourseCertificateIfEligible(review.submission.studentId, review.submission.courseId);
    certificate = result.certificate;
  }

  revalidatePath("/student/peer-review");
  revalidatePath("/student/settings");
  return { success: true, graded, certificate };
}
