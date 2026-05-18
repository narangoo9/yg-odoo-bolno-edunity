-- Collapse platform user roles to USER / COMPANY / SUPER_ADMIN.
-- Existing STUDENT users become USER. Existing INSTRUCTOR and ORG_ADMIN users become COMPANY.

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "org_invites" ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMPANY', 'SUPER_ADMIN');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE "role"::text
      WHEN 'STUDENT' THEN 'USER'
      WHEN 'INSTRUCTOR' THEN 'COMPANY'
      WHEN 'ORG_ADMIN' THEN 'COMPANY'
      WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
      ELSE 'USER'
    END
  )::"UserRole";

ALTER TABLE "org_invites"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE "role"::text
      WHEN 'STUDENT' THEN 'USER'
      WHEN 'INSTRUCTOR' THEN 'COMPANY'
      WHEN 'ORG_ADMIN' THEN 'COMPANY'
      WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
      ELSE 'USER'
    END
  )::"UserRole";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
ALTER TABLE "org_invites" ALTER COLUMN "role" SET DEFAULT 'USER';

DROP TYPE "UserRole_old";
