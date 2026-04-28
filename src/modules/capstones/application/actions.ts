"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  submitCapstoneSchema,
  submitPeerReviewSchema,
  type SubmitCapstoneInput,
  type SubmitPeerReviewInput,
} from "../domain/schemas";

// ─── SUBMIT CAPSTONE ───────────────────────────────────────────────────────────

export async function submitCapstone(input: SubmitCapstoneInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = submitCapstoneSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { courseId, programId, title, description, submissionUrl, fileUrls } = parsed.data;

  if (!courseId && !programId) {
    return { error: "Курс эсвэл программ заавал шаардлагатай" };
  }

  // Check for existing capstone
  const existing = await db.capstone.findFirst({
    where: {
      studentId: session.user.id,
      ...(courseId ? { courseId } : { programId }),
    },
  });

  let capstone;
  if (existing) {
    if (existing.status === "GRADED") {
      return { error: "Дүгнэгдсэн ажлыг дахин илгээх боломжгүй" };
    }
    capstone = await db.capstone.update({
      where: { id: existing.id },
      data: {
        title,
        description,
        submissionUrl: submissionUrl || null,
        fileUrls,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  } else {
    capstone = await db.capstone.create({
      data: {
        studentId: session.user.id,
        courseId: courseId || null,
        programId: programId || null,
        title,
        description,
        submissionUrl: submissionUrl || null,
        fileUrls,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  // Auto-assign peer reviewers (up to 2 other students from same course/program)
  await assignPeerReviewers(capstone.id, session.user.id, courseId, programId);

  return { success: true, capstoneId: capstone.id };
}

async function assignPeerReviewers(
  capstoneId: string,
  studentId: string,
  courseId?: string,
  programId?: string,
) {
  // Find other students enrolled in the same course/program
  const enrollments = courseId
    ? await db.enrollment.findMany({
        where: { courseId, studentId: { not: studentId }, status: "ACTIVE" },
        select: { studentId: true },
        take: 5,
      })
    : await db.programEnrollment.findMany({
        where: { programId: programId!, studentId: { not: studentId } },
        select: { studentId: true },
        take: 5,
      });

  // Pick up to 2 reviewers who haven't already been assigned to this capstone
  const existingReviewers = await db.capstoneReview.findMany({
    where: { capstoneId },
    select: { reviewerId: true },
  });
  const existingIds = new Set(existingReviewers.map((r) => r.reviewerId));

  const candidates = enrollments
    .map((e) => e.studentId)
    .filter((id) => !existingIds.has(id))
    .slice(0, 2);

  if (candidates.length > 0) {
    await db.capstoneReview.createMany({
      data: candidates.map((reviewerId) => ({ capstoneId, reviewerId })),
      skipDuplicates: true,
    });
  }
}

// ─── SUBMIT PEER REVIEW ───────────────────────────────────────────────────────

export async function submitPeerReview(input: SubmitPeerReviewInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = submitPeerReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { capstoneId, score, feedback, rubricScores } = parsed.data;

  const review = await db.capstoneReview.findUnique({
    where: { capstoneId_reviewerId: { capstoneId, reviewerId: session.user.id } },
  });

  if (!review) return { error: "Хянах эрхгүй байна" };
  if (review.isCompleted) return { error: "Хянах ажил аль хэдийн дүүрсэн" };

  await db.$transaction(async (tx) => {
    await tx.capstoneReview.update({
      where: { capstoneId_reviewerId: { capstoneId, reviewerId: session.user.id } },
      data: { score, feedback, rubricScores, isCompleted: true, completedAt: new Date() },
    });

    // Check if all reviews done → compute average and grade capstone
    const allReviews = await tx.capstoneReview.findMany({ where: { capstoneId } });
    const completed = allReviews.filter((r) => r.isCompleted && r.score !== null);
    if (completed.length === allReviews.length && completed.length > 0) {
      const avgScore = completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length;
      await tx.capstone.update({
        where: { id: capstoneId },
        data: { status: "GRADED", score: avgScore, gradedAt: new Date() },
      });
    } else {
      // Mark as under review
      await tx.capstone.updateMany({
        where: { id: capstoneId, status: "SUBMITTED" },
        data: { status: "UNDER_REVIEW" },
      });
    }
  });

  return { success: true };
}

// ─── GET STUDENT CAPSTONES ─────────────────────────────────────────────────────

export async function getStudentCapstones() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const capstones = await db.capstone.findMany({
    where: { studentId: session.user.id },
    include: {
      course: { select: { title: true } },
      program: { select: { title: true } },
      reviews: { select: { isCompleted: true, score: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { capstones };
}

// ─── GET PENDING REVIEWS ───────────────────────────────────────────────────────

export async function getPendingReviews() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const reviews = await db.capstoneReview.findMany({
    where: { reviewerId: session.user.id, isCompleted: false },
    include: {
      capstone: {
        include: {
          student: { select: { name: true } },
          course: { select: { title: true } },
          program: { select: { title: true } },
        },
      },
    },
  });

  return { reviews };
}
