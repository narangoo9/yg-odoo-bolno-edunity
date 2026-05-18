import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Устгах user-ийн бүх холбоотой өгөгдлийг transaction дотор цэвэрлэнэ. */
export async function deleteUserById(tx: Tx, userId: string) {
  const orders = await tx.order.findMany({
    where: { userId },
    select: { id: true },
  });
  const orderIds = orders.map((order) => order.id);

  const capstones = await tx.capstone.findMany({
    where: { studentId: userId },
    select: { id: true },
  });
  const capstoneIds = capstones.map((capstone) => capstone.id);

  const comments = await tx.comment.findMany({
    where: { authorId: userId },
    select: { id: true },
  });
  const commentIds = comments.map((comment) => comment.id);

  await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } });

  if (orderIds.length > 0) {
    await tx.refundRequest.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  if (commentIds.length > 0) {
    await tx.reaction.deleteMany({
      where: { contentType: "COMMENT", contentId: { in: commentIds } },
    });
    await tx.comment.updateMany({
      where: { parentId: { in: commentIds }, authorId: { not: userId } },
      data: { parentId: null },
    });
    await tx.comment.deleteMany({ where: { authorId: userId } });
  }

  await tx.reaction.deleteMany({ where: { userId } });
  await tx.lessonSectionCompletion.deleteMany({ where: { studentId: userId } });
  await tx.course_section_completions.deleteMany({ where: { studentId: userId } });
  await tx.course_section_task_states.deleteMany({ where: { userId } });
  await tx.course_section_watch_progress.deleteMany({ where: { userId } });
  await tx.study_notes.deleteMany({ where: { userId } });
  await tx.learning_activities.deleteMany({ where: { userId } });

  if (capstoneIds.length > 0) {
    await tx.capstoneReview.deleteMany({ where: { capstoneId: { in: capstoneIds } } });
  }

  await tx.directMessage.deleteMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
  });
  await tx.friendship.deleteMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
  });
  await tx.referral.deleteMany({
    where: { OR: [{ referrerId: userId }, { referredId: userId }] },
  });
  await tx.capstoneReview.deleteMany({ where: { reviewerId: userId } });
  await tx.courseSectionTaskReview.deleteMany({ where: { reviewerId: userId } });
  await tx.courseSectionTaskSubmission.deleteMany({ where: { studentId: userId } });
  await tx.capstone.deleteMany({ where: { studentId: userId } });
  await tx.certificate.deleteMany({ where: { studentId: userId } });
  await tx.quizAttempt.deleteMany({ where: { studentId: userId } });
  await tx.progress.deleteMany({ where: { studentId: userId } });
  await tx.enrollment.deleteMany({ where: { studentId: userId } });
  await tx.programEnrollment.deleteMany({ where: { studentId: userId } });
  await tx.review.deleteMany({ where: { studentId: userId } });
  await tx.payment.deleteMany({ where: { userId } });
  await tx.subscription.deleteMany({ where: { userId } });
  await tx.dailyChallengeCompletion.deleteMany({ where: { userId } });
  await tx.aiUsageLog.deleteMany({ where: { userId } });
  await tx.aiSession.deleteMany({ where: { userId } });
  await tx.studyPlan.deleteMany({ where: { userId } });
  await tx.userLearningProfile.deleteMany({ where: { userId } });
  await tx.savedCourse.deleteMany({ where: { userId } });
  await tx.todoItem.deleteMany({ where: { userId } });
  await tx.note.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });
  await tx.leaderboardEntry.deleteMany({ where: { userId } });
  await tx.xpLog.deleteMany({ where: { userId } });
  await tx.userBadge.deleteMany({ where: { userId } });
  await tx.walletCredit.deleteMany({ where: { userId } });
  await tx.xpConversion.deleteMany({ where: { userId } });
  await tx.lessonChatMessage.deleteMany({ where: { userId } });
  await tx.organizationMember.deleteMany({ where: { userId } });
  await tx.account.deleteMany({ where: { userId } });
  await tx.session.deleteMany({ where: { userId } });
  await tx.verificationToken.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
}
