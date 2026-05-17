CREATE TABLE IF NOT EXISTS "course_section_task_submissions" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "submissionUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "score" DOUBLE PRECISION,
  "feedback" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gradedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_section_task_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "course_section_task_reviews" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "feedback" TEXT,
  "rubricScores" JSONB,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_section_task_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_section_task_submissions_studentId_sectionId_key"
  ON "course_section_task_submissions"("studentId", "sectionId");
CREATE INDEX IF NOT EXISTS "course_section_task_submissions_courseId_status_idx"
  ON "course_section_task_submissions"("courseId", "status");
CREATE INDEX IF NOT EXISTS "course_section_task_submissions_studentId_courseId_idx"
  ON "course_section_task_submissions"("studentId", "courseId");
CREATE INDEX IF NOT EXISTS "course_section_task_submissions_sectionId_idx"
  ON "course_section_task_submissions"("sectionId");

CREATE UNIQUE INDEX IF NOT EXISTS "course_section_task_reviews_submissionId_reviewerId_key"
  ON "course_section_task_reviews"("submissionId", "reviewerId");
CREATE INDEX IF NOT EXISTS "course_section_task_reviews_reviewerId_isCompleted_idx"
  ON "course_section_task_reviews"("reviewerId", "isCompleted");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_section_task_submissions_courseId_fkey') THEN
    ALTER TABLE "course_section_task_submissions"
      ADD CONSTRAINT "course_section_task_submissions_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_section_task_submissions_sectionId_fkey') THEN
    ALTER TABLE "course_section_task_submissions"
      ADD CONSTRAINT "course_section_task_submissions_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_section_task_submissions_studentId_fkey') THEN
    ALTER TABLE "course_section_task_submissions"
      ADD CONSTRAINT "course_section_task_submissions_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_section_task_reviews_submissionId_fkey') THEN
    ALTER TABLE "course_section_task_reviews"
      ADD CONSTRAINT "course_section_task_reviews_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "course_section_task_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_section_task_reviews_reviewerId_fkey') THEN
    ALTER TABLE "course_section_task_reviews"
      ADD CONSTRAINT "course_section_task_reviews_reviewerId_fkey"
      FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
