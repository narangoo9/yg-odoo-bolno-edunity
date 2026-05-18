import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { issueCourseCertificateIfEligible } from "@/lib/learning/certificates";
import { isCourseCompletedForCertificate } from "@/lib/learning/progress";

export const MIN_PEER_REVIEWS = 3;
export const MIN_REVIEWS_GIVEN_FOR_CERT = 2;
export const PASS_STAR_AVERAGE = 3.5;
export const PASS_RUBRIC_AVERAGE = 70;

export function rubricAverage(review: {
  rubricUnderstanding: number;
  rubricEffort: number;
  rubricFunctionality: number;
  rubricDesign: number;
}) {
  return (
    review.rubricUnderstanding +
    review.rubricEffort +
    review.rubricFunctionality +
    review.rubricDesign
  ) / 4;
}

export function reviewsPassCriteria(reviews: Array<{
  starRating: number;
  rubricUnderstanding: number;
  rubricEffort: number;
  rubricFunctionality: number;
  rubricDesign: number;
  decision: string;
}>) {
  if (reviews.length < MIN_PEER_REVIEWS) return false;
  const starAvg = reviews.reduce((s, r) => s + r.starRating, 0) / reviews.length;
  const rubricAvg =
    reviews.reduce((s, r) => s + rubricAverage(r), 0) / reviews.length;
  const passVotes = reviews.filter((r) => r.decision === "PASS").length;
  return (
    (starAvg >= PASS_STAR_AVERAGE || rubricAvg >= PASS_RUBRIC_AVERAGE) &&
    passVotes >= Math.ceil(MIN_PEER_REVIEWS / 2)
  );
}

export async function isFinalProjectUnlocked(userId: string, courseId: string) {
  return isCourseCompletedForCertificate(userId, courseId);
}

export async function countReviewsGiven(userId: string, courseId?: string) {
  const [sectionReviews, finalReviews] = await Promise.all([
    db.courseSectionTaskReview.count({
      where: {
        reviewerId: userId,
        isCompleted: true,
        ...(courseId
          ? { submission: { courseId } }
          : {}),
      },
    }),
    db.courseFinalProjectReview.count({
      where: {
        reviewerId: userId,
        ...(courseId
          ? { submission: { courseId } }
          : {}),
      },
    }),
  ]);
  return sectionReviews + finalReviews;
}

export async function getFinalProjectStatus(userId: string, courseId: string) {
  const [unlocked, submission, lessonsComplete, reviewsGiven] = await Promise.all([
    isFinalProjectUnlocked(userId, courseId),
    db.courseFinalProjectSubmission.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
      include: {
        reviews: {
          select: {
            id: true,
            reviewerId: true,
            starRating: true,
            rubricUnderstanding: true,
            rubricEffort: true,
            rubricFunctionality: true,
            rubricDesign: true,
            feedback: true,
            decision: true,
            createdAt: true,
          },
        },
      },
    }),
    isCourseCompletedForCertificate(userId, courseId),
    countReviewsGiven(userId, courseId),
  ]);

  const reviewCount = submission?.reviews.length ?? 0;
  const passed = submission
    ? reviewsPassCriteria(submission.reviews)
    : false;

  return {
    unlocked,
    lessonsComplete,
    reviewsGiven,
    reviewsRequired: MIN_REVIEWS_GIVEN_FOR_CERT,
    submission: submission
      ? {
          id: submission.id,
          title: submission.title,
          description: submission.description,
          demoUrl: submission.demoUrl,
          githubUrl: submission.githubUrl,
          attachmentUrl: submission.attachmentUrl,
          status: submission.status,
          isBlocked: submission.isBlocked,
          submittedAt: submission.submittedAt?.toISOString() ?? null,
          reviewCount,
          passed,
          reviews: submission.reviews.map((r) => ({
            ...r,
            rubricAverage: rubricAverage(r),
            createdAt: r.createdAt.toISOString(),
          })),
        }
      : null,
  };
}

async function notify(
  userId: string,
  type:
    | "FINAL_PROJECT_UNLOCKED"
    | "PROJECT_SUBMITTED"
    | "PEER_REVIEW_RECEIVED"
    | "PROJECT_PASSED"
    | "CERTIFICATE_READY",
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await db.notification
    .create({
      data: {
        userId,
        type,
        title,
        body,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => null);
}

export async function submitFinalProject(input: {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  demoUrl?: string;
  githubUrl?: string;
  attachmentUrl?: string;
}) {
  const unlocked = await isFinalProjectUnlocked(input.userId, input.courseId);
  if (!unlocked) {
    return { error: "Эхлээд курсын бүх хичээлийг 90%-аас дээш үзэж дуусгана уу." };
  }

  const existing = await db.courseFinalProjectSubmission.findUnique({
    where: {
      studentId_courseId: { studentId: input.userId, courseId: input.courseId },
    },
    include: { reviews: { select: { id: true } } },
  });

  if (existing?.reviews.length) {
    return { error: "Peer review эхэлсэн тул төслийг засах боломжгүй." };
  }
  if (existing?.status === "PASSED") {
    return { error: "Төсөл аль хэдийн баталгаажсан байна." };
  }

  const submission = await db.courseFinalProjectSubmission.upsert({
    where: {
      studentId_courseId: { studentId: input.userId, courseId: input.courseId },
    },
    create: {
      studentId: input.userId,
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      demoUrl: input.demoUrl ?? null,
      githubUrl: input.githubUrl ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      title: input.title,
      description: input.description,
      demoUrl: input.demoUrl ?? null,
      githubUrl: input.githubUrl ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await notify(
    input.userId,
    "PROJECT_SUBMITTED",
    "Final Project илгээгдлээ",
    "Таны төсөл peer review queue-д орлоо.",
    { submissionId: submission.id, courseId: input.courseId },
  );

  return { submission };
}

export async function getFinalProjectReviewQueue(
  reviewerId: string,
  courseId?: string,
) {
  return db.courseFinalProjectSubmission.findMany({
    where: {
      studentId: { not: reviewerId },
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      isBlocked: false,
      reviews: { none: { reviewerId } },
      ...(courseId ? { courseId } : {}),
      course: {
        enrollments: { some: { studentId: reviewerId, status: "ACTIVE" } },
      },
    },
    include: {
      student: { select: { id: true, name: true, avatarUrl: true } },
      course: { select: { id: true, title: true } },
      reviews: { select: { id: true, decision: true, starRating: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: 20,
  });
}

export async function submitFinalProjectReview(input: {
  reviewerId: string;
  submissionId: string;
  starRating: number;
  rubricUnderstanding: number;
  rubricEffort: number;
  rubricFunctionality: number;
  rubricDesign: number;
  feedback: string;
  decision: "PASS" | "NEEDS_IMPROVEMENT";
}) {
  const submission = await db.courseFinalProjectSubmission.findUnique({
    where: { id: input.submissionId },
    select: {
      id: true,
      studentId: true,
      courseId: true,
      status: true,
      isBlocked: true,
    },
  });

  if (!submission) return { error: "Төсөл олдсонгүй" };
  if (submission.studentId === input.reviewerId) return { error: "Өөрийн төслийг review хийх боломжгүй" };
  if (submission.isBlocked) return { error: "Энэ төсөл түр хаагдсан байна" };

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: input.reviewerId, courseId: submission.courseId },
    },
    select: { id: true },
  });
  if (!enrollment) return { error: "Энэ курсын review хийх эрхгүй" };

  await db.courseFinalProjectReview.create({
    data: {
      submissionId: input.submissionId,
      reviewerId: input.reviewerId,
      starRating: input.starRating,
      rubricUnderstanding: input.rubricUnderstanding,
      rubricEffort: input.rubricEffort,
      rubricFunctionality: input.rubricFunctionality,
      rubricDesign: input.rubricDesign,
      feedback: input.feedback,
      decision: input.decision,
    },
  });

  const reviews = await db.courseFinalProjectReview.findMany({
    where: { submissionId: input.submissionId },
  });

  await db.courseFinalProjectSubmission.update({
    where: { id: input.submissionId },
    data: { status: "UNDER_REVIEW" },
  });

  await notify(
    submission.studentId,
    "PEER_REVIEW_RECEIVED",
    "Шинэ peer review",
    "Таны Final Project-д шинэ үнэлгээ ирлээ.",
    { submissionId: submission.id },
  );

  let passed = false;
  if (reviews.length >= MIN_PEER_REVIEWS && reviewsPassCriteria(reviews)) {
    passed = true;
    await db.courseFinalProjectSubmission.update({
      where: { id: input.submissionId },
      data: { status: "PASSED" },
    });
    await notify(
      submission.studentId,
      "PROJECT_PASSED",
      "Final Project амжилттай",
      "Таны төсөл peer review шаардлагыг хангалаа.",
      { submissionId: submission.id },
    );
  } else if (
    reviews.length >= MIN_PEER_REVIEWS &&
    !reviewsPassCriteria(reviews)
  ) {
    await db.courseFinalProjectSubmission.update({
      where: { id: input.submissionId },
      data: { status: "NEEDS_IMPROVEMENT" },
    });
  }

  const certificate = passed
    ? (await issueCourseCertificateIfEligible(submission.studentId, submission.courseId))
        .certificate
    : null;

  return { success: true, reviewCount: reviews.length, passed, certificate };
}

export async function maybeNotifyFinalProjectUnlocked(userId: string, courseId: string) {
  const unlocked = await isFinalProjectUnlocked(userId, courseId);
  if (!unlocked) return;

  const existing = await db.courseFinalProjectSubmission.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
    select: { id: true },
  });
  if (existing) return;

  await notify(
    userId,
    "FINAL_PROJECT_UNLOCKED",
    "Final Project нээгдлээ",
    "Бүх хичээл дууссан. Одоо төслөө илгээнэ үү.",
    { courseId },
  );
}
