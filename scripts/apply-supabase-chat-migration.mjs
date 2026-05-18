/**
 * Applies supabase/migrations/20260515000000_realtime_chat.sql to your Supabase Postgres.
 * Requires SUPABASE_DB_URL (direct connection string from Supabase dashboard).
 *
 * Usage: node scripts/apply-supabase-chat-migration.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.SUPABASE_DB_URL?.trim();
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL in .env");
  console.error("Supabase → Project Settings → Database → Connection string (URI)");
  process.exit(1);
}

const sqlPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
  "20260515000000_realtime_chat.sql",
);

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
try {
  await client.query(readFileSync(sqlPath, "utf8"));
  console.log("Supabase realtime chat tables applied.");
} finally {
  await client.end();
}
