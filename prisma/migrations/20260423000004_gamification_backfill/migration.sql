DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'BadgeType'
  ) THEN
    CREATE TYPE "BadgeType" AS ENUM (
      'FIRST_LESSON',
      'FIRST_COURSE',
      'STREAK_7',
      'STREAK_30',
      'STREAK_100',
      'QUIZ_MASTER',
      'SPEED_LEARNER',
      'TOP_10',
      'COURSE_CREATOR',
      'PERFECT_SCORE',
      'EARLY_BIRD'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'XpAction'
  ) THEN
    CREATE TYPE "XpAction" AS ENUM (
      'LESSON_COMPLETE',
      'QUIZ_PASS',
      'QUIZ_PERFECT',
      'COURSE_COMPLETE',
      'STREAK_BONUS',
      'DAILY_CHALLENGE',
      'REVIEW_SUBMIT',
      'REFERRAL_SIGNUP'
    );
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "coins" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "lastStreakAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "user_badges" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badge" "BadgeType" NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "xp_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" "XpAction" NOT NULL,
  "amount" INTEGER NOT NULL,
  "entityId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weeklyXp" INTEGER NOT NULL DEFAULT 0,
  "monthlyXp" INTEGER NOT NULL DEFAULT 0,
  "totalXp" INTEGER NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "weeklyRank" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_challenges" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correctIdx" INTEGER NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 25,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_challenge_completions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "daily_challenge_completions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_userId_badge_key"
  ON "user_badges"("userId", "badge");

CREATE INDEX IF NOT EXISTS "xp_logs_userId_createdAt_idx"
  ON "xp_logs"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_entries_userId_key"
  ON "leaderboard_entries"("userId");

CREATE INDEX IF NOT EXISTS "leaderboard_entries_totalXp_idx"
  ON "leaderboard_entries"("totalXp" DESC);

CREATE INDEX IF NOT EXISTS "leaderboard_entries_weeklyXp_idx"
  ON "leaderboard_entries"("weeklyXp" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_challenges_date_key"
  ON "daily_challenges"("date");

CREATE UNIQUE INDEX IF NOT EXISTS "daily_challenge_completions_userId_challengeId_key"
  ON "daily_challenge_completions"("userId", "challengeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_badges_userId_fkey'
  ) THEN
    ALTER TABLE "user_badges"
      ADD CONSTRAINT "user_badges_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'xp_logs_userId_fkey'
  ) THEN
    ALTER TABLE "xp_logs"
      ADD CONSTRAINT "xp_logs_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_entries_userId_fkey'
  ) THEN
    ALTER TABLE "leaderboard_entries"
      ADD CONSTRAINT "leaderboard_entries_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'daily_challenge_completions_challengeId_fkey'
  ) THEN
    ALTER TABLE "daily_challenge_completions"
      ADD CONSTRAINT "daily_challenge_completions_challengeId_fkey"
      FOREIGN KEY ("challengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE;
  END IF;
END $$;
