/**
 * Applies performance indexes without `prisma migrate dev` (avoids drift reset prompt).
 * Uses DIRECT_URL from .env via Prisma db execute.
 */
import "./load-env.mjs";
import { execSync } from "node:child_process";

const file = "prisma/migrations/20260515000000_perf_indexes/migration.sql";

console.log("Applying safe indexes to Neon (no reset)...");
execSync(
  `npx prisma db execute --file ${file} --schema prisma/schema.prisma`,
  { stdio: "inherit", env: process.env },
);
console.log("Done. Indexes created with IF NOT EXISTS.");
