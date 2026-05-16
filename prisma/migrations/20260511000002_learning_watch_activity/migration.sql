-- Course section video watch progress

CREATE TABLE IF NOT EXISTS "course_section_watch_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "lastPositionSec" INTEGER NOT NULL DEFAULT 0,
    "watchTimeSec" INTEGER NOT NULL DEFAULT 0,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_section_watch_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_section_watch_progress_userId_sectionId_key" ON "course_section_watch_progress"("userId", "sectionId");
CREATE INDEX IF NOT EXISTS "course_section_watch_progress_userId_courseId_idx" ON "course_section_watch_progress"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "course_section_watch_progress_userId_lastWatchedAt_idx" ON "course_section_watch_progress"("userId", "lastWatchedAt");
