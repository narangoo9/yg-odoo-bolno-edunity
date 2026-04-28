DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'FriendshipStatus'
  ) THEN
    CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "friendships" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "addresseeId" TEXT NOT NULL,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'friendships_requesterId_fkey'
  ) THEN
    ALTER TABLE "friendships"
      ADD CONSTRAINT "friendships_requesterId_fkey"
      FOREIGN KEY ("requesterId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'friendships_addresseeId_fkey'
  ) THEN
    ALTER TABLE "friendships"
      ADD CONSTRAINT "friendships_addresseeId_fkey"
      FOREIGN KEY ("addresseeId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "friendships_requesterId_addresseeId_key"
  ON "friendships"("requesterId", "addresseeId");

CREATE INDEX IF NOT EXISTS "friendships_addresseeId_status_idx"
  ON "friendships"("addresseeId", "status");
