-- Backfill certificate organization IDs where they can be derived from
-- the linked program or course. Some standalone course certificates remain
-- organization-less by design.

UPDATE "certificates" AS c
SET "organizationId" = p."organizationId"
FROM "programs" AS p
WHERE c."organizationId" IS NULL
  AND c."programId" = p."id"
  AND p."organizationId" IS NOT NULL;

UPDATE "certificates" AS c
SET "organizationId" = cr."organizationId"
FROM "courses" AS cr
WHERE c."organizationId" IS NULL
  AND c."courseId" = cr."id"
  AND cr."organizationId" IS NOT NULL;
