-- Safe performance indexes (idempotent). No data loss.
-- Apply with: npx prisma db execute --file prisma/migrations/20260515000000_perf_indexes/migration.sql --schema prisma/schema.prisma

CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "payments_status_createdAt_idx" ON "payments"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "payments_subscriptionId_idx" ON "payments"("subscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_plan_idx" ON "subscriptions"("plan");
CREATE INDEX IF NOT EXISTS "subscriptions_createdAt_idx" ON "subscriptions"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "users_role_status_idx" ON "users"("role", "status");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt" DESC);
