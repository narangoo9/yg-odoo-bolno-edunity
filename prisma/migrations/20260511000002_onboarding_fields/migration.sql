-- User onboarding fields (lightweight profile)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "learningGoal" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "learningLevel" TEXT;
