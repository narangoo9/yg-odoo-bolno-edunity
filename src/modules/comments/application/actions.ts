"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postCommentSchema, type PostCommentInput } from "../domain/schemas";

// ─── POST COMMENT ──────────────────────────────────────────────────────────────

export async function postComment(input: PostCommentInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = postCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { contentType, contentId, body, parentId } = parsed.data;

  // Validate parent exists and belongs to same content if replying
  if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.contentId !== contentId || parent.isDeleted) {
      return { error: "Эцэг сэтгэгдэл олдсонгүй" };
    }
  }

  const comment = await db.comment.create({
    data: {
      contentType,
      contentId,
      authorId: session.user.id,
      body,
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return { success: true, comment };
}

// ─── POST COURSE CHANNEL MESSAGE ───────────────────────────────────────────────
export async function postCourseMessage(courseId: string, body: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };
  if (!body.trim()) return { error: "Message cannot be empty" };

  const comment = await db.comment.create({
    data: {
      contentType: "COURSE",
      contentId: courseId,
      authorId: session.user.id,
      body: body.trim(),
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return { success: true, comment };
}

// ─── GET COMMENTS ──────────────────────────────────────────────────────────────

export async function getComments(
  contentType: "LESSON" | "COURSE" | "CAPSTONE" | "PROGRAM",
  contentId: string,
) {
  const comments = await db.comment.findMany({
    where: { contentType, contentId, parentId: null, isDeleted: false },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      replies: {
        where: { isDeleted: false },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { comments };
}

// ─── DELETE COMMENT ────────────────────────────────────────────────────────────

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Сэтгэгдэл олдсонгүй" };

  const canDelete =
    comment.authorId === session.user.id ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "COMPANY";

  if (!canDelete) return { error: "Зөвшөөрөл хангалтгүй" };

  await db.comment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });

  return { success: true };
}
