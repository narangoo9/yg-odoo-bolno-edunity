DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseSourceType') THEN
    CREATE TYPE "CourseSourceType" AS ENUM ('YOUTUBE');
  END IF;
END $$;

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceType" "CourseSourceType",
  ADD COLUMN IF NOT EXISTS "sourceYoutubeId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceYoutubeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

CREATE TABLE IF NOT EXISTS "course_sections" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "startSeconds" INTEGER NOT NULL,
  "endSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "course_sections_time_check" CHECK (
    "startSeconds" >= 0 AND ("endSeconds" IS NULL OR "endSeconds" > "startSeconds")
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_sections_courseId_order_key"
  ON "course_sections"("courseId", "order");

CREATE UNIQUE INDEX IF NOT EXISTS "course_sections_courseId_startSeconds_key"
  ON "course_sections"("courseId", "startSeconds");

CREATE INDEX IF NOT EXISTS "course_sections_courseId_order_idx"
  ON "course_sections"("courseId", "order");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_courseId_fkey'
  ) THEN
    ALTER TABLE "course_sections"
      ADD CONSTRAINT "course_sections_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
