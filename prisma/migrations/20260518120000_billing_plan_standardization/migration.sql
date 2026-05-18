-- Billing plan standardization (STANDARD / PREMIUM / PRO)
-- Safe data migration — does not drop legacy enum values.

UPDATE "subscriptions"
SET "plan" = 'STANDARD'
WHERE "plan" IN ('FREE', 'BASIC', 'STUDENT');

UPDATE "subscriptions"
SET "plan" = 'PRO'
WHERE "plan" IN ('ENTERPRISE', 'INSTRUCTOR', 'ORGANIZATION');

-- Organizations keep their own tier field; map legacy free tier to STANDARD where used.
UPDATE "organizations"
SET "plan" = 'STANDARD'
WHERE "plan" IN ('FREE', 'BASIC', 'STUDENT');
