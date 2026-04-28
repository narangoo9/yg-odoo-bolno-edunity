-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: phase1_5_full
-- Adds all models for Phases 1–5:
--   Phase 1: OrganizationMember, new enums (OrgMemberRole/Status)
--   Phase 2: Capstone, CapstoneReview, Comment + enums
--   Phase 3: Order, OrderItem, RefundRequest + enums
--   Phase 4: Reaction, TodoItem, DirectMessage + enums
--   Phase 5: AiSession, AiMessage, AiUsageLog + enums
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── PHASE 1 ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'INSTRUCTOR', 'VIEWER');
CREATE TYPE "OrgMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- ─── PHASE 2 ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE "CapstoneStatus" AS ENUM (
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'GRADED', 'REJECTED'
);
CREATE TYPE "CommentContentType" AS ENUM (
  'LESSON', 'COURSE', 'CAPSTONE', 'PROGRAM'
);

-- ─── PHASE 3 ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'
);
CREATE TYPE "RefundStatus" AS ENUM (
  'REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED'
);

-- ─── PHASE 4 ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ReactionContentType" AS ENUM (
  'COMMENT', 'LESSON', 'COURSE', 'MESSAGE', 'CAPSTONE'
);

-- ─── PHASE 5 ENUMS ───────────────────────────────────────────────────────────

CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 1 — ORGANIZATION MEMBERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "organization_members" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "role"           "OrgMemberRole"   NOT NULL DEFAULT 'INSTRUCTOR',
  "status"         "OrgMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "invitedBy"      TEXT,
  "joinedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("organizationId", "userId"),
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId")         REFERENCES "users"("id")         ON DELETE CASCADE
);
CREATE INDEX "organization_members_orgId_status_idx" ON "organization_members"("organizationId", "status");
CREATE INDEX "organization_members_userId_idx"       ON "organization_members"("userId");

-- Back-fill OrganizationMember rows from existing User.organizationId
-- (instructors/admins who already belong to an org)
INSERT INTO "organization_members" ("id", "organizationId", "userId", "role", "status")
SELECT gen_random_uuid(), u."organizationId", u."id",
  CASE WHEN u."role" = 'ORG_ADMIN' THEN 'OWNER'::"OrgMemberRole"
       ELSE 'INSTRUCTOR'::"OrgMemberRole"
  END,
  'ACTIVE'::"OrgMemberStatus"
FROM "users" u
WHERE u."organizationId" IS NOT NULL
  AND u."role" IN ('ORG_ADMIN', 'INSTRUCTOR')
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 2 — CAPSTONE, PEER REVIEW, COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "capstones" (
  "id"            TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "courseId"      TEXT,
  "programId"     TEXT,
  "studentId"     TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "submissionUrl" TEXT,
  "fileUrls"      TEXT[] NOT NULL DEFAULT '{}',
  "status"        "CapstoneStatus" NOT NULL DEFAULT 'DRAFT',
  "score"         DOUBLE PRECISION,
  "feedback"      TEXT,
  "submittedAt"   TIMESTAMP(3),
  "gradedAt"      TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId")  REFERENCES "users"("id")    ON DELETE RESTRICT,
  FOREIGN KEY ("courseId")   REFERENCES "courses"("id")  ON DELETE SET NULL,
  FOREIGN KEY ("programId")  REFERENCES "programs"("id") ON DELETE SET NULL
);
CREATE INDEX "capstones_studentId_idx" ON "capstones"("studentId");
CREATE INDEX "capstones_courseId_idx"  ON "capstones"("courseId");

CREATE TABLE "capstone_reviews" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "capstoneId"   TEXT NOT NULL,
  "reviewerId"   TEXT NOT NULL,
  "score"        DOUBLE PRECISION,
  "feedback"     TEXT,
  "rubricScores" JSONB,
  "isCompleted"  BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("capstoneId", "reviewerId"),
  FOREIGN KEY ("capstoneId") REFERENCES "capstones"("id") ON DELETE CASCADE,
  FOREIGN KEY ("reviewerId") REFERENCES "users"("id")     ON DELETE RESTRICT
);

CREATE TABLE "comments" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "contentType" "CommentContentType" NOT NULL,
  "contentId"   TEXT NOT NULL,
  "authorId"    TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "parentId"    TEXT,
  "isDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL
);
CREATE INDEX "comments_content_idx" ON "comments"("contentType", "contentId", "createdAt" DESC);
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 3 — COMMERCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "orders" (
  "id"                      TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                  TEXT NOT NULL,
  "status"                  "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalAmount"             DECIMAL(10,2) NOT NULL,
  "discountAmount"          DECIMAL(10,2) NOT NULL DEFAULT 0,
  "finalAmount"             DECIMAL(10,2) NOT NULL,
  "currency"                TEXT NOT NULL DEFAULT 'MNT',
  "couponId"                TEXT,
  "stripePaymentIntentId"   TEXT UNIQUE,
  "stripeReceiptUrl"        TEXT,
  "notes"                   TEXT,
  "metadata"                JSONB,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId")   REFERENCES "users"("id")   ON DELETE RESTRICT,
  FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL
);
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");

CREATE TABLE "order_items" (
  "id"               TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"          TEXT NOT NULL,
  "courseId"         TEXT,
  "programId"        TEXT,
  "subscriptionPlan" "SubscriptionPlan",
  "unitPrice"        DECIMAL(10,2) NOT NULL,
  "commissionRate"   DECIMAL(5,2)  NOT NULL,
  "commissionAmount" DECIMAL(10,2) NOT NULL,
  "orgAmount"        DECIMAL(10,2) NOT NULL,
  "organizationId"   TEXT,
  FOREIGN KEY ("orderId")   REFERENCES "orders"("id")   ON DELETE CASCADE,
  FOREIGN KEY ("courseId")  REFERENCES "courses"("id")  ON DELETE SET NULL,
  FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL
);

CREATE TABLE "refund_requests" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"        TEXT NOT NULL UNIQUE,
  "requestedBy"    TEXT NOT NULL,
  "reason"         TEXT NOT NULL,
  "status"         "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
  "refundAmount"   DECIMAL(10,2),
  "processedBy"    TEXT,
  "processedAt"    TIMESTAMP(3),
  "stripeRefundId" TEXT,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 4 — ENGAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "reactions" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "contentType" "ReactionContentType" NOT NULL,
  "contentId"   TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "emoji"       TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("contentType", "contentId", "userId", "emoji"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "reactions_content_idx" ON "reactions"("contentType", "contentId");

CREATE TABLE "todo_items" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT,
  "imageUrl"    TEXT,
  "dueDate"     TIMESTAMP(3),
  "priority"    "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
  "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt" TIMESTAMP(3),
  "orderIndex"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "todo_items_userId_idx" ON "todo_items"("userId", "isCompleted");

CREATE TABLE "direct_messages" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId"    TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "imageUrl"    TEXT,
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt"      TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("senderId")    REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "direct_messages_pair_idx" ON "direct_messages"("senderId", "recipientId", "createdAt" DESC);
CREATE INDEX "direct_messages_recipient_unread_idx" ON "direct_messages"("recipientId", "isRead");

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 5 — AI COPILOT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "ai_sessions" (
  "id"        TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "title"     TEXT,
  "courseId"  TEXT,
  "lessonId"  TEXT,
  "programId" TEXT,
  "model"     TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "ai_sessions_userId_idx" ON "ai_sessions"("userId", "createdAt" DESC);

CREATE TABLE "ai_messages" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"    TEXT NOT NULL,
  "role"         "AiMessageRole" NOT NULL,
  "content"      TEXT NOT NULL,
  "inputTokens"  INTEGER,
  "outputTokens" INTEGER,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "ai_sessions"("id") ON DELETE CASCADE
);
CREATE INDEX "ai_messages_sessionId_idx" ON "ai_messages"("sessionId", "createdAt");

CREATE TABLE "ai_usage_logs" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       TEXT NOT NULL,
  "action"       TEXT NOT NULL,
  "inputTokens"  INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "cost"         DECIMAL(10,6),
  "sessionId"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId", "createdAt");
