-- Migration: programs_wallet_commission
-- Adds: Program/Track, ProgramCourse, ProgramEnrollment, OrgPayout,
--       WalletCredit, XpConversion; updates Certificate, Payment, Organization, User

-- ─── NEW ENUMS ───────────────────────────────────────────────────────────────

CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- ─── NEW SUBSCRIPTION PLAN VALUES ────────────────────────────────────────────

ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'BASIC';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'STANDARD';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PREMIUM';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PRO';

-- ─── UPDATE ORGANIZATION ─────────────────────────────────────────────────────

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS "payoutSettings"  JSONB;

-- ─── UPDATE USER ─────────────────────────────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "walletBalance"   DECIMAL(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "xpCreditsEarned" DECIMAL(10,4) NOT NULL DEFAULT 0;

-- ─── UPDATE PAYMENT ──────────────────────────────────────────────────────────

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "programId"       TEXT,
  ADD COLUMN IF NOT EXISTS "organizationId"  TEXT,
  ADD COLUMN IF NOT EXISTS "commissionRate"  DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "orgAmount"       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "payoutId"        TEXT;

-- ─── PROGRAM ─────────────────────────────────────────────────────────────────

CREATE TABLE "programs" (
  "id"                     TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId"         TEXT NOT NULL,
  "title"                  TEXT NOT NULL,
  "slug"                   TEXT NOT NULL UNIQUE,
  "description"            TEXT,
  "thumbnailUrl"           TEXT,
  "status"                 "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
  "certificateTitle"       TEXT,
  "certificateDescription" TEXT,
  "isOrdered"              BOOLEAN NOT NULL DEFAULT FALSE,
  "publishedAt"            TIMESTAMP(3),
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);

CREATE INDEX "programs_organizationId_status_idx" ON "programs"("organizationId", "status");

-- ─── PROGRAM COURSES (join table) ────────────────────────────────────────────

CREATE TABLE "program_courses" (
  "id"         TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "programId"  TEXT NOT NULL,
  "courseId"   TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isRequired" BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE ("programId", "courseId"),
  FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE,
  FOREIGN KEY ("courseId")  REFERENCES "courses"("id")  ON DELETE CASCADE
);

-- ─── PROGRAM ENROLLMENTS ─────────────────────────────────────────────────────

CREATE TABLE "program_enrollments" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId"   TEXT NOT NULL,
  "programId"   TEXT NOT NULL,
  "status"      "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "enrolledAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "source"      TEXT,
  UNIQUE ("studentId", "programId"),
  FOREIGN KEY ("studentId") REFERENCES "users"("id")    ON DELETE RESTRICT,
  FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT
);

CREATE INDEX "program_enrollments_studentId_status_idx" ON "program_enrollments"("studentId", "status");

-- ─── UPDATE CERTIFICATE (org-issued, program or course scoped) ───────────────

-- Drop old unique constraint (studentId, courseId) — certs can now also be per-program
ALTER TABLE "certificates" DROP CONSTRAINT IF EXISTS "certificates_studentId_courseId_key";

ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "organizationId"      TEXT,
  ADD COLUMN IF NOT EXISTS "programId"           TEXT,
  ADD COLUMN IF NOT EXISTS "programEnrollmentId" TEXT UNIQUE;

-- courseId is now optional (program certs don't reference a single course)
ALTER TABLE "certificates" ALTER COLUMN "courseId" DROP NOT NULL;

-- Add new unique index: one cert per student per program
CREATE UNIQUE INDEX IF NOT EXISTS "certificates_studentId_programId_key"
  ON "certificates"("studentId", "programId")
  WHERE "programId" IS NOT NULL;

-- Add new FK references
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "certificates_programId_fkey"
    FOREIGN KEY ("programId")      REFERENCES "programs"("id")      ON DELETE SET NULL,
  ADD CONSTRAINT "certificates_programEnrollmentId_fkey"
    FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id") ON DELETE SET NULL;

-- ─── ORG PAYOUTS ─────────────────────────────────────────────────────────────

CREATE TABLE "org_payouts" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "amount"         DECIMAL(10,2) NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'MNT',
  "status"         "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "periodStart"    TIMESTAMP(3) NOT NULL,
  "periodEnd"      TIMESTAMP(3) NOT NULL,
  "paidAt"         TIMESTAMP(3),
  "reference"      TEXT,
  "notes"          TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);

CREATE INDEX "org_payouts_organizationId_status_idx" ON "org_payouts"("organizationId", "status");

-- Link payments to payouts
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "org_payouts"("id") ON DELETE SET NULL;

-- ─── XP CONVERSIONS ──────────────────────────────────────────────────────────

CREATE TABLE "xp_conversions" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       TEXT NOT NULL,
  "xpAmount"     INTEGER NOT NULL,
  "creditAmount" DECIMAL(10,4) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "xp_conversions_userId_idx" ON "xp_conversions"("userId");

-- ─── WALLET CREDITS ──────────────────────────────────────────────────────────

CREATE TABLE "wallet_credits" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"         TEXT NOT NULL,
  "amount"         DECIMAL(10,4) NOT NULL,
  "balanceAfter"   DECIMAL(10,4) NOT NULL,
  "source"         TEXT NOT NULL,
  "description"    TEXT,
  "xpConversionId" TEXT UNIQUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId")         REFERENCES "users"("id")         ON DELETE CASCADE,
  FOREIGN KEY ("xpConversionId") REFERENCES "xp_conversions"("id") ON DELETE SET NULL
);

CREATE INDEX "wallet_credits_userId_createdAt_idx" ON "wallet_credits"("userId", "createdAt");
