import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Course болон түүний холбоотой бүх өгөгдлийг устгана (YouTube биш course цэвэрлэхэд). */
export async function deleteCourseById(tx: Tx, courseId: string) {
  const quizzes = await tx.quiz.findMany({
    where: { courseId },
    select: { id: true },
  });
  const quizIds = quizzes.map((q) => q.id);

  if (quizIds.length > 0) {
    const attempts = await tx.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);
    if (attemptIds.length > 0) {
      await tx.quizAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
    }
    await tx.questionOption.deleteMany({
      where: { question: { quizId: { in: quizIds } } },
    });
    await tx.quizAnswer.deleteMany({ where: { question: { quizId: { in: quizIds } } } });
    await tx.question.deleteMany({ where: { quizId: { in: quizIds } } });
    await tx.quiz.deleteMany({ where: { id: { in: quizIds } } });
  }

  const capstones = await tx.capstone.findMany({
    where: { courseId },
    select: { id: true },
  });
  const capstoneIds = capstones.map((c) => c.id);
  if (capstoneIds.length > 0) {
    await tx.capstoneReview.deleteMany({ where: { capstoneId: { in: capstoneIds } } });
    await tx.capstone.deleteMany({ where: { id: { in: capstoneIds } } });
  }

  await tx.lessonChatMessage.deleteMany({ where: { courseId } });
  await tx.savedCourse.deleteMany({ where: { courseId } });
  await tx.review.deleteMany({ where: { courseId } });
  await tx.enrollment.deleteMany({ where: { courseId } });
  await tx.progress.deleteMany({ where: { courseId } });
  await tx.certificate.deleteMany({ where: { courseId } });
  await tx.orderItem.deleteMany({ where: { courseId } });
  await tx.programCourse.deleteMany({ where: { courseId } });
  await tx.courseSectionTaskSubmission.deleteMany({ where: { courseId } });
  await tx.course.delete({ where: { id: courseId } });
}
