"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type DeleteUserResult = { success: true } | { error: string };

export async function deleteAdminUser(userId: string): Promise<DeleteUserResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Эрхгүй байна." };
  }

  if (session.user.id === userId) {
    return { error: "Өөрийн ашиглаж байгаа админ account-ыг устгах боломжгүй." };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      ownedOrg: { select: { id: true } },
    },
  });

  if (!user) return { error: "Хэрэглэгч олдсонгүй." };

  if (user.role === "SUPER_ADMIN") {
    const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) {
      return { error: "Сүүлийн super admin account-ыг устгах боломжгүй." };
    }
  }

  if (user.ownedOrg) {
    return { error: "Энэ хэрэглэгч байгууллага эзэмшдэг тул эхлээд байгууллагын owner-ийг шилжүүлнэ үү." };
  }

  await db.$transaction(async (tx) => {
    await tx.course.updateMany({
      where: { instructorId: userId },
      data: { instructorId: session.user.id },
    });

    const orders = await tx.order.findMany({
      where: { userId },
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    if (orderIds.length > 0) {
      await tx.refundRequest.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

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
    if (commentIds.length > 0) {
      await tx.reaction.deleteMany({
        where: { contentType: "COMMENT", contentId: { in: commentIds } },
      });
    }
    await tx.capstoneReview.deleteMany({
      where: {
        OR: [
          { reviewerId: userId },
          ...(capstoneIds.length > 0 ? [{ capstoneId: { in: capstoneIds } }] : []),
        ],
      },
    });
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

    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return { success: true };
}
