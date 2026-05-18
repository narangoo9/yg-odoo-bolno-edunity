import { db } from "@/lib/db";
import { toChatUuid } from "@/lib/supabase/chat-identity";

export type ChatMessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

function toRecord(message: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}): ChatMessageRecord {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    content: message.content,
    created_at: message.createdAt.toISOString(),
    read_at: message.readAt?.toISOString() ?? null,
  };
}

export async function ensureCourseConversation(input: {
  conversationId: string;
  courseId: string;
  title: string;
  instructorUserId: string;
  memberChatUserIds: string[];
  currentChatUserId: string;
  currentRole: "instructor" | "member";
}) {
  await db.chatConversation.upsert({
    where: { id: input.conversationId },
    create: {
      id: input.conversationId,
      kind: "course",
      courseId: input.courseId,
      title: input.title,
      createdBy: toChatUuid(input.instructorUserId),
    },
    update: {
      title: input.title,
      courseId: input.courseId,
    },
  });

  const members = new Map<string, { conversationId: string; userId: string; role: string }>();
  members.set(input.currentChatUserId, {
    conversationId: input.conversationId,
    userId: input.currentChatUserId,
    role: input.currentRole,
  });
  members.set(toChatUuid(input.instructorUserId), {
    conversationId: input.conversationId,
    userId: toChatUuid(input.instructorUserId),
    role: "instructor",
  });
  input.memberChatUserIds.forEach(userId => {
    members.set(userId, {
      conversationId: input.conversationId,
      userId,
      role: "member",
    });
  });

  await db.chatConversationMember.createMany({
    data: Array.from(members.values()),
    skipDuplicates: true,
  });
}

export async function listCourseChatMessages(
  conversationId: string,
  after?: string,
): Promise<ChatMessageRecord[]> {
  const messages = await db.chatMessage.findMany({
    where: {
      conversationId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return messages.map(toRecord);
}

export async function createCourseChatMessage(input: {
  conversationId: string;
  senderChatUserId: string;
  content: string;
}): Promise<ChatMessageRecord> {
  const message = await db.chatMessage.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderChatUserId,
      content: input.content,
    },
  });

  return toRecord(message);
}
