import { randomUUID } from "crypto";
import { db } from "@/lib/db";

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

  const [completedSections, gradedTasks, taskAverage] = await Promise.all([
    db.course_section_completions.count({
      where: { studentId, course_sections: { courseId } },
    }),
    db.courseSectionTaskSubmission.count({
      where: { studentId, courseId, status: "GRADED" },
    }),
    db.courseSectionTaskSubmission.aggregate({
      where: { studentId, courseId, status: "GRADED", score: { not: null } },
      _avg: { score: true },
    }),
  ]);

  if (completedSections < course._count.sections || gradedTasks < course._count.sections) {
    return { issued: false, certificate: null };
  }

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
        peerReviewedTasks: gradedTasks,
        averageTaskScore: taskAverage._avg.score ?? null,
      },
    },
    select: { id: true, certificateNo: true, verificationCode: true },
  });

  await db.notification.create({
    data: {
      userId: studentId,
      type: "CERTIFICATE_READY",
      title: "Certificate бэлэн боллоо",
      body: `${course.title} курсийн бүх video task peer review-ээр баталгаажиж certificate нээгдлээ.`,
      data: { certificateId: certificate.id, courseId },
    },
  }).catch(() => null);

  return { issued: true, certificate };
}
