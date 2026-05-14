CREATE TABLE IF NOT EXISTS "lesson_sections" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL,
  "youtubeId" TEXT NOT NULL,
  "startSeconds" INTEGER NOT NULL,
  "endSeconds" INTEGER NOT NULL,
  "taskTitle" TEXT,
  "taskDescription" TEXT,
  "pdfUrl" TEXT,
  "resourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lesson_sections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lesson_sections_time_check" CHECK ("startSeconds" >= 0 AND "endSeconds" > "startSeconds")
);

CREATE TABLE IF NOT EXISTS "lesson_section_completions" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lesson_section_completions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lesson_sections_lessonId_order_key"
  ON "lesson_sections"("lessonId", "order");

CREATE INDEX IF NOT EXISTS "lesson_sections_lessonId_order_idx"
  ON "lesson_sections"("lessonId", "order");

CREATE UNIQUE INDEX IF NOT EXISTS "lesson_section_completions_sectionId_studentId_key"
  ON "lesson_section_completions"("sectionId", "studentId");

CREATE INDEX IF NOT EXISTS "lesson_section_completions_studentId_idx"
  ON "lesson_section_completions"("studentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_sections_lessonId_fkey'
  ) THEN
    ALTER TABLE "lesson_sections"
      ADD CONSTRAINT "lesson_sections_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_section_completions_sectionId_fkey'
  ) THEN
    ALTER TABLE "lesson_section_completions"
      ADD CONSTRAINT "lesson_section_completions_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "lesson_sections"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_section_completions_studentId_fkey'
  ) THEN
    ALTER TABLE "lesson_section_completions"
      ADD CONSTRAINT "lesson_section_completions_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
