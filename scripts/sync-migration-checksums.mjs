/**
 * After restoring missing migration.sql files, align Neon checksums with local files.
 */
import "./load-env.mjs";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

function checksumFor(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

const migrationsDir = "prisma/migrations";
const names = readdirSync(migrationsDir).filter((name) => {
  const p = join(migrationsDir, name);
  return statSync(p).isDirectory();
});

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

for (const name of names) {
  const sqlPath = join(migrationsDir, name, "migration.sql");
  try {
    const checksum = checksumFor(sqlPath);
    const res = await client.query(
      `UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = $2`,
      [checksum, name],
    );
    if (res.rowCount > 0) {
      console.log(`Updated checksum: ${name}`);
    }
  } catch {
    /* no migration.sql */
  }
}

await client.end();
console.log("Checksum sync complete.");
