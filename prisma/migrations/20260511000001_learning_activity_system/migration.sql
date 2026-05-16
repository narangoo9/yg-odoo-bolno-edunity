-- Learning activity, course sections progress, saved courses, study notes, AI profile/plans

CREATE TABLE IF NOT EXISTS "user_learning_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "weakTopics" JSONB NOT NULL DEFAULT '[]',
    "interests" JSONB NOT NULL DEFAULT '[]',
    "availableTimePerDay" TEXT,
    "currentLevel" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'mn',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_learning_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_learning_profiles_userId_key" ON "user_learning_profiles"("userId");
CREATE INDEX IF NOT EXISTS "user_learning_profiles_userId_idx" ON "user_learning_profiles"("userId");

CREATE TABLE IF NOT EXISTS "study_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "study_plans_userId_status_idx" ON "study_plans"("userId", "status");

CREATE TABLE IF NOT EXISTS "saved_courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "saved_courses_userId_courseId_key" ON "saved_courses"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "saved_courses_userId_savedAt_idx" ON "saved_courses"("userId", "savedAt" DESC);

CREATE TABLE IF NOT EXISTS "course_section_completions" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_section_completions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "course_section_completions_sectionId_studentId_key" ON "course_section_completions"("sectionId", "studentId");
CREATE INDEX IF NOT EXISTS "course_section_completions_studentId_idx" ON "course_section_completions"("studentId");

CREATE TABLE IF NOT EXISTS "course_section_task_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'not-started',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpAwarded" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "course_section_task_states_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "course_section_task_states_userId_sectionId_key" ON "course_section_task_states"("userId", "sectionId");
CREATE INDEX IF NOT EXISTS "course_section_task_states_userId_courseId_idx" ON "course_section_task_states"("userId", "courseId");

CREATE TABLE IF NOT EXISTS "study_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "study_notes_userId_courseId_idx" ON "study_notes"("userId", "courseId");

CREATE TABLE IF NOT EXISTS "learning_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "sectionId" TEXT,
    "type" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "metadata" JSONB,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "learning_activities_userId_dedupeKey_key" ON "learning_activities"("userId", "dedupeKey");
CREATE INDEX IF NOT EXISTS "learning_activities_userId_courseId_idx" ON "learning_activities"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "learning_activities_userId_createdAt_idx" ON "learning_activities"("userId", "createdAt");

ALTER TABLE "ai_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "todo_items" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'user';
ALTER TABLE "todo_items" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'user';

DO $$ BEGIN
  ALTER TYPE "AiMessageRole" ADD VALUE IF NOT EXISTS 'TOOL';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
