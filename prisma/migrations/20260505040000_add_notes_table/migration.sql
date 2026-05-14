-- CreateTable: notes
CREATE TABLE IF NOT EXISTS "notes" (
    "id"          TEXT         NOT NULL,
    "userId"      TEXT         NOT NULL,
    "col"         TEXT         NOT NULL DEFAULT 'todo',
    "title"       TEXT         NOT NULL DEFAULT 'New Card',
    "content"     TEXT         NOT NULL DEFAULT '',
    "checklist"   JSONB        NOT NULL DEFAULT '[]',
    "color"       TEXT         NOT NULL DEFAULT 'white',
    "coverImage"  TEXT,
    "tags"        TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "orderIndex"  INTEGER      NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notes_userId_col_idx" ON "notes"("userId", "col");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_userId_fkey'
  ) THEN
    ALTER TABLE "notes"
      ADD CONSTRAINT "notes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
