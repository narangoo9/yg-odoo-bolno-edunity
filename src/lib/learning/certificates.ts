import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  MIN_PEER_REVIEWS,
  MIN_REVIEWS_GIVEN_FOR_CERT,
  reviewsPassCriteria,
  countReviewsGiven,
} from "@/lib/learning/final-project";
import { isCourseCompletedForCertificate } from "@/lib/learning/progress";

function certificateNo() {
  return `CERT-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function issueCourseCertificateIfEligible(studentId: string, courseId: string) {
  const existing = await db.certificate.findFirst({
    where: { studentId, courseId },
    select: { id: true, certificateNo: true, verificationCode: true },
  });
  if (existing) return { issued: false, certificate: existing };

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      organizationId: true,
      instructor: { select: { name: true } },
      _count: { select: { sections: true } },
    },
  });
  if (!course || course._count.sections === 0) return { issued: false, certificate: null };

  const lessonsComplete = await isCourseCompletedForCertificate(studentId, courseId);
  if (!lessonsComplete) return { issued: false, certificate: null };

  const finalProject = await db.courseFinalProjectSubmission.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: {
      reviews: {
        select: {
          starRating: true,
          rubricUnderstanding: true,
          rubricEffort: true,
          rubricFunctionality: true,
          rubricDesign: true,
          decision: true,
        },
      },
    },
  });

  if (!finalProject || finalProject.isBlocked) {
    return { issued: false, certificate: null };
  }

  if (finalProject.status !== "PASSED" || finalProject.reviews.length < MIN_PEER_REVIEWS) {
    if (finalProject.reviews.length >= MIN_PEER_REVIEWS && reviewsPassCriteria(finalProject.reviews)) {
      await db.courseFinalProjectSubmission.update({
        where: { id: finalProject.id },
        data: { status: "PASSED" },
      });
    } else {
      return { issued: false, certificate: null };
    }
  }

  const reviewsGiven = await countReviewsGiven(studentId, courseId);
  if (reviewsGiven < MIN_REVIEWS_GIVEN_FOR_CERT) {
    return { issued: false, certificate: null };
  }

  const starAvg =
    finalProject.reviews.reduce((s, r) => s + r.starRating, 0) / finalProject.reviews.length;
  const rubricAvg =
    finalProject.reviews.reduce(
      (s, r) =>
        s +
        (r.rubricUnderstanding + r.rubricEffort + r.rubricFunctionality + r.rubricDesign) / 4,
      0,
    ) / finalProject.reviews.length;

  const certificate = await db.certificate.create({
    data: {
      studentId,
      courseId,
      organizationId: course.organizationId,
      certificateNo: certificateNo(),
      verificationCode: randomUUID(),
      metadata: {
        courseTitle: course.title,
        instructorName: course.instructor.name,
        finalProjectReviews: finalProject.reviews.length,
        averageStar: starAvg,
        averageRubric: rubricAvg,
        reviewsGiven,
      },
    },
    select: { id: true, certificateNo: true, verificationCode: true },
  });

  await db.notification
    .create({
      data: {
        userId: studentId,
        type: "CERTIFICATE_READY",
        title: "Certificate бэлэн боллоо",
        body: `${course.title} курсын Final Project болон peer review шаардлагыг хангаж certificate нээгдлээ.`,
        data: { certificateId: certificate.id, courseId },
      },
    })
    .catch(() => null);

  return { issued: true, certificate };
}
