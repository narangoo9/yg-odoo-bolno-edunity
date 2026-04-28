"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserMessages } from "@/lib/dashboard-cache";
import {
  createTodoSchema,
  updateTodoSchema,
  addReactionSchema,
  sendDmSchema,
  type CreateTodoInput,
  type UpdateTodoInput,
  type AddReactionInput,
  type SendDmInput,
} from "../domain/schemas";

// ─── TODOS ─────────────────────────────────────────────────────────────────────

export async function createTodo(input: CreateTodoInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = createTodoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, body, imageUrl, dueDate, priority } = parsed.data;

  const maxOrder = await db.todoItem.aggregate({
    where: { userId: session.user.id },
    _max: { orderIndex: true },
  });

  const todo = await db.todoItem.create({
    data: {
      userId: session.user.id,
      title,
      body: body ?? null,
      imageUrl: imageUrl || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
    },
  });

  return { success: true, todo };
}

export async function updateTodo(input: UpdateTodoInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = updateTodoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, isCompleted, title, body, imageUrl, dueDate, priority, orderIndex } = parsed.data;

  const todo = await db.todoItem.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) return { error: "Олдсонгүй" };

  const updated = await db.todoItem.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(priority !== undefined && { priority }),
      ...(orderIndex !== undefined && { orderIndex }),
      ...(isCompleted !== undefined && {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      }),
    },
  });

  return { success: true, todo: updated };
}

export async function deleteTodo(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const todo = await db.todoItem.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) return { error: "Олдсонгүй" };

  await db.todoItem.delete({ where: { id } });
  return { success: true };
}

export async function getTodos() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const todos = await db.todoItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isCompleted: "asc" }, { orderIndex: "asc" }, { createdAt: "desc" }],
  });

  return { todos };
}

// ─── REACTIONS ─────────────────────────────────────────────────────────────────

export async function toggleReaction(input: AddReactionInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = addReactionSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const { contentType, contentId, emoji } = parsed.data;

  const existing = await db.reaction.findUnique({
    where: {
      contentType_contentId_userId_emoji: {
        contentType,
        contentId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { success: true, action: "removed" };
  }

  await db.reaction.create({
    data: { contentType, contentId, userId: session.user.id, emoji },
  });

  return { success: true, action: "added" };
}

export async function getReactions(
  contentType: "COMMENT" | "LESSON" | "COURSE" | "MESSAGE" | "CAPSTONE",
  contentId: string,
) {
  const reactions = await db.reaction.groupBy({
    by: ["emoji"],
    where: { contentType, contentId },
    _count: { emoji: true },
  });

  return { reactions: reactions.map((r) => ({ emoji: r.emoji, count: r._count.emoji })) };
}

// ─── DIRECT MESSAGES ───────────────────────────────────────────────────────────

export async function sendDirectMessage(input: SendDmInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = sendDmSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { recipientId, body, imageUrl } = parsed.data;

  if (recipientId === session.user.id) return { error: "Өөртөө мессеж илгээх боломжгүй" };

  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (!recipient) return { error: "Хэрэглэгч олдсонгүй" };

  const msg = await db.directMessage.create({
    data: {
      senderId: session.user.id,
      recipientId,
      body,
      imageUrl: imageUrl || null,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  revalidateUserMessages(recipientId);

  return { success: true, message: msg };
}

export async function getConversation(partnerId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const messages = await db.directMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id, recipientId: partnerId },
        { senderId: partnerId, recipientId: session.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages as read
  await db.directMessage.updateMany({
    where: { senderId: partnerId, recipientId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  revalidateUserMessages(session.user.id);

  return { messages };
}

export async function getConversationList() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  // Get distinct partners
  const sent = await db.directMessage.findMany({
    where: { senderId: session.user.id },
    select: { recipientId: true },
    distinct: ["recipientId"],
  });
  const received = await db.directMessage.findMany({
    where: { recipientId: session.user.id },
    select: { senderId: true },
    distinct: ["senderId"],
  });

  const partnerIds = [
    ...new Set([...sent.map((m) => m.recipientId), ...received.map((m) => m.senderId)]),
  ];

  const partners = await Promise.all(
    partnerIds.map(async (pid) => {
      const lastMsg = await db.directMessage.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, recipientId: pid },
            { senderId: pid, recipientId: session.user.id },
          ],
        },
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await db.directMessage.count({
        where: { senderId: pid, recipientId: session.user.id, isRead: false },
      });

      const partner = await db.user.findUnique({
        where: { id: pid },
        select: { id: true, name: true, avatarUrl: true },
      });

      return { partner, lastMsg, unreadCount };
    })
  );

  return { conversations: partners.filter((p) => p.partner !== null) };
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) return { results: [] };

  const q = query.trim();

  const [courses, programs, users] = await Promise.all([
    db.course.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, thumbnailUrl: true, slug: true },
      take: 5,
    }),
    db.program.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, title: true, slug: true, organizationId: true },
      take: 5,
    }),
    db.user.findMany({
      where: {
        role: { in: ["INSTRUCTOR", "ORG_ADMIN"] },
        status: "ACTIVE",
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, avatarUrl: true, role: true },
      take: 5,
    }),
  ]);

  const results = [
    ...courses.map((c) => ({ type: "course" as const, id: c.id, title: c.title, href: `/courses/${c.slug}`, image: c.thumbnailUrl })),
    ...programs.map((p) => ({ type: "program" as const, id: p.id, title: p.title, href: `/org/programs/${p.id}`, image: null })),
    ...users.map((u) => ({ type: "user" as const, id: u.id, title: u.name, href: `/instructor/${u.id}`, image: u.avatarUrl })),
  ];

  return { results };
}
