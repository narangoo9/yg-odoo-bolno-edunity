-- CreateEnum
CREATE TYPE "FinalProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PASSED', 'NEEDS_IMPROVEMENT', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FINAL_PROJECT_UNLOCKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PEER_REVIEW_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_PASSED';

-- CreateTable
CREATE TABLE "course_final_project_submissions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "programId" TEXT,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "demoUrl" TEXT,
    "githubUrl" TEXT,
    "attachmentUrl" TEXT,
    "status" "FinalProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_final_project_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_final_project_reviews" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "rubricUnderstanding" INTEGER NOT NULL,
    "rubricEffort" INTEGER NOT NULL,
    "rubricFunctionality" INTEGER NOT NULL,
    "rubricDesign" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_final_project_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_final_project_submissions_studentId_courseId_key" ON "course_final_project_submissions"("studentId", "courseId");
CREATE INDEX "course_final_project_submissions_courseId_status_idx" ON "course_final_project_submissions"("courseId", "status");
CREATE INDEX "course_final_project_submissions_studentId_createdAt_idx" ON "course_final_project_submissions"("studentId", "createdAt" DESC);

CREATE UNIQUE INDEX "course_final_project_reviews_submissionId_reviewerId_key" ON "course_final_project_reviews"("submissionId", "reviewerId");
CREATE INDEX "course_final_project_reviews_reviewerId_createdAt_idx" ON "course_final_project_reviews"("reviewerId", "createdAt" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_studentId_courseId_key" ON "certificates"("studentId", "courseId");

ALTER TABLE "course_final_project_submissions" ADD CONSTRAINT "course_final_project_submissions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_project_submissions" ADD CONSTRAINT "course_final_project_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_project_reviews" ADD CONSTRAINT "course_final_project_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "course_final_project_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_project_reviews" ADD CONSTRAINT "course_final_project_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
