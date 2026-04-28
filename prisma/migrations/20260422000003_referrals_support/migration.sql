ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredById" TEXT;

UPDATE "users"
SET "referralCode" = "id"
WHERE "referralCode" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key"
  ON "users"("referralCode");

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "convertedAt" TIMESTAMP(3),
  "rewardXp" INTEGER NOT NULL DEFAULT 500,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referredId_key"
  ON "referrals"("referredId");

CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx"
  ON "referrals"("referrerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'referrals_referrerId_fkey'
  ) THEN
    ALTER TABLE "referrals"
      ADD CONSTRAINT "referrals_referrerId_fkey"
      FOREIGN KEY ("referrerId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'referrals_referredId_fkey'
  ) THEN
    ALTER TABLE "referrals"
      ADD CONSTRAINT "referrals_referredId_fkey"
      FOREIGN KEY ("referredId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
