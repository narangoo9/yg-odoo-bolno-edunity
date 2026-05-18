import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/modules/auth/domain/schemas";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        bio: true, role: true, status: true, createdAt: true,
        emailVerified: true, organizationId: true,
      },
    });
    if (!user) return unauthorized();
    return ok(user);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        bio: parsed.data.bio || null,
        avatarUrl: parsed.data.avatarUrl || null,
      },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATE",
        entity: "User",
        entityId: session.user.id,
        newData: parsed.data as object,
      },
    });

    revalidateUserDashboard(session.user.id);
    revalidateTag("admin-analytics");
    revalidatePath("/", "layout");

    return ok(user, "Профайл амжилттай шинэчлэгдлээ");
  } catch {
    return serverError();
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, ownedOrg: { select: { id: true } } },
    });

    if (!user) return unauthorized();
    if (user.role === "SUPER_ADMIN") {
      return badRequest("Super admin account-ыг эндээс устгах боломжгүй.");
    }
    if (user.ownedOrg) {
      return badRequest("Байгууллагын owner account устгахын өмнө owner эрхээ шилжүүлнэ үү.");
    }
    const courseCount = await db.course.count({ where: { instructorId: userId } });
    if (courseCount > 0) {
      return badRequest("Course үүсгэсэн account-ыг шууд устгах боломжгүй. Эхлээд course owner-оо шилжүүлнэ үү.");
    }

    await db.$transaction(async (tx) => {
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
        await tx.reaction.deleteMany({ where: { contentType: "COMMENT", contentId: { in: commentIds } } });
      }
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
    });

    revalidateTag("admin-analytics");
    revalidatePath("/", "layout");
    return ok({ deleted: true }, "Account устгагдлаа");
  } catch (error) {
    console.error("DELETE /api/v1/users/me error:", error);
    return serverError();
  }
}
