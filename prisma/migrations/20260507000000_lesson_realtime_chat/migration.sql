CREATE TABLE "lesson_chat_messages" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "companyId" TEXT,
  "courseId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "replyToId" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "editedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lesson_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lesson_chat_messages_tenantId_idx" ON "lesson_chat_messages"("tenantId");
CREATE INDEX "lesson_chat_messages_companyId_idx" ON "lesson_chat_messages"("companyId");
CREATE INDEX "lesson_chat_messages_courseId_idx" ON "lesson_chat_messages"("courseId");
CREATE INDEX "lesson_chat_messages_lessonId_idx" ON "lesson_chat_messages"("lessonId");
CREATE INDEX "lesson_chat_messages_lessonId_createdAt_idx" ON "lesson_chat_messages"("lessonId", "createdAt");
CREATE INDEX "lesson_chat_messages_userId_createdAt_idx" ON "lesson_chat_messages"("userId", "createdAt");

ALTER TABLE "lesson_chat_messages"
  ADD CONSTRAINT "lesson_chat_messages_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_chat_messages"
  ADD CONSTRAINT "lesson_chat_messages_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_chat_messages"
  ADD CONSTRAINT "lesson_chat_messages_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_chat_messages"
  ADD CONSTRAINT "lesson_chat_messages_replyToId_fkey"
  FOREIGN KEY ("replyToId") REFERENCES "lesson_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
