"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitReviewSchema, type SubmitReviewInput } from "../domain/schemas";

export async function submitReview(input: SubmitReviewInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId: parsed.data.courseId } },
  });
  if (!enrollment) return { error: "Зөвхөн бүртгүүлсэн оюутан үнэлгээ үлдээх боломжтой" };

  const review = await db.review.upsert({
    where: { studentId_courseId: { studentId: session.user.id, courseId: parsed.data.courseId } },
    create: {
      studentId: session.user.id,
      courseId: parsed.data.courseId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      isApproved: true,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  // Revalidate course page
  const course = await db.course.findUnique({ where: { id: parsed.data.courseId }, select: { slug: true } });
  if (course) revalidatePath(`/courses/${course.slug}`);

  return { success: true, data: review };
}

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Сэтгэгдэл олдсонгүй" };
  if (review.studentId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return { error: "Эрхгүй" };
  }

  await db.review.delete({ where: { id: reviewId } });

  return { success: true };
}

export async function replyToReview(reviewId: string, reply: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { course: true },
  });
  if (!review) return { error: "Олдсонгүй" };
  if (review.course.instructorId !== session.user.id) return { error: "Эрхгүй" };

  await db.review.update({
    where: { id: reviewId },
    data: { instructorReply: reply },
  });

  return { success: true };
}
