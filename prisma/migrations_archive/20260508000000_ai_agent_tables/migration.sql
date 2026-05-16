-- ═══════════════════════════════════════════════════════════════════════════
-- EduNity AI Agent — incremental SQL (runs AFTER init / programs migrations).
-- Must stay chronologically after migrations that create "users" and related tables.
-- Authoritative schema: prisma/schema.prisma — prefer: npx prisma migrate dev
-- Avoid `db push` on DBs managed by migrations (certificates index drift).
-- ═══════════════════════════════════════════════════════════════════════════

-- New tables (Prisma @@map names; columns use Prisma’s default mapping)
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
    CONSTRAINT "user_learning_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_learning_profiles_userId_key" UNIQUE ("userId"),
    CONSTRAINT "user_learning_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "study_plans_userId_status_idx" ON "study_plans"("userId", "status");

-- ai_messages: agent metadata (NDJSON / tool refs)
ALTER TABLE "ai_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

-- todo_items / notes: AI provenance
ALTER TABLE "todo_items" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'user';
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'user';

-- AiMessageRole enum: add TOOL (skip if already present; may error on PG < 15 without IF NOT EXISTS)
DO $$ BEGIN
  ALTER TYPE "AiMessageRole" ADD VALUE IF NOT EXISTS 'TOOL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Supabase RLS (optional): only if you use Supabase Auth and map auth.uid() to "users".id
-- ALTER TABLE "user_learning_profiles" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "user_learning_profiles_own" ON "user_learning_profiles"
--   FOR ALL USING ("userId" = (auth.jwt()->>'sub'));
