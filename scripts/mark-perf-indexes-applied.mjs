/**
 * After apply-safe-indexes.mjs, optionally record migration in history (no schema change).
 */
import "./load-env.mjs";
import { execSync } from "node:child_process";

execSync(
  "npx prisma migrate resolve --applied 20260515000000_perf_indexes",
  { stdio: "inherit", env: process.env },
);
console.log("Marked 20260515000000_perf_indexes as applied in _prisma_migrations.");
