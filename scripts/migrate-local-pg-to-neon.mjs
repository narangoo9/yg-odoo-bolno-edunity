/**
 * Restore the prepared local Postgres dump into Neon without Docker.
 *
 * Default dump:
 *   backups/elearn-blue-postgres-source-inserts.prisma.sql
 *
 * Required:
 *   DATABASE_URL or DIRECT_URL must point to Neon.
 *   CONFIRM_RESTORE=1 must be set because the dump contains DROP/CREATE statements.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const defaultDump = path.join(root, "backups", "elearn-blue-postgres-source-inserts.prisma.sql");
const dumpFile = path.resolve(process.argv[2] || process.env.NEON_RESTORE_DUMP || defaultDump);

function isPlaceholder(value = "") {
  return !value.trim() || /USER:PASSWORD|@HOST|ep-xxxx/i.test(value);
}

function loadEnvFile(name) {
  const p = path.join(root, name);
  if (!existsSync(p)) return;

  const text = readFileSync(p, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2].replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined || isPlaceholder(process.env[key])) {
      process.env[key] = value;
    }
  }
}

function maskUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.username = parsed.username ? "***" : "";
    parsed.password = parsed.password ? "***" : "";
    return parsed.toString();
  } catch {
    return "(invalid url)";
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const targetUrl =
  [process.env.MIGRATE_TARGET_URL, process.env.DIRECT_URL, process.env.DATABASE_URL]
    .map((value) => value?.trim() || "")
    .find((value) => value && !isPlaceholder(value)) || "";

if (!existsSync(dumpFile)) {
  console.error(`Dump file not found: ${dumpFile}`);
  process.exit(1);
}

if (!targetUrl) {
  console.error("Set DATABASE_URL or DIRECT_URL to your Neon connection string before restoring.");
  process.exit(1);
}

if (!/neon\.tech/i.test(targetUrl) && process.env.MIGRATE_ALLOW_NON_NEON !== "1") {
  console.error("Target URL does not look like Neon. Refusing restore. Set MIGRATE_ALLOW_NON_NEON=1 to override.");
  process.exit(1);
}

if (process.env.CONFIRM_RESTORE !== "1") {
  console.error("Restore is destructive. Re-run with CONFIRM_RESTORE=1 after confirming the target Neon DB is correct.");
  console.error(`Target: ${maskUrl(targetUrl)}`);
  console.error(`Dump: ${dumpFile}`);
  process.exit(1);
}

console.log("Restoring SQL dump to Neon with Prisma db execute...");
console.log(`Target: ${maskUrl(targetUrl)}`);
console.log(`Dump: ${dumpFile}`);

const result = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--file", dumpFile, "--schema", "prisma/schema.prisma"],
  {
    cwd: root,
    shell: process.platform === "win32",
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: targetUrl,
      DIRECT_URL: targetUrl,
    },
  },
);

process.exit(result.status ?? 1);
