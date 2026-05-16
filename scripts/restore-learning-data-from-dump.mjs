import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

const root = process.cwd();
const dumpPath = path.resolve(
  process.argv[2] || path.join(root, "backups", "elearn-2026-05-05T01-38-46-449Z.sql"),
);

const targetTables = [
  "users",
  "organizations",
  "categories",
  "courses",
  "course_modules",
  "lessons",
  "enrollments",
];

function loadEnvFile(name) {
  const text = readFileSync(path.join(root, name), "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    if (process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
  }
}

function connectionUrl() {
  loadEnvFile(".env");
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_URL is required.");
  return url
    .replace(/&channel_binding=require/g, "")
    .replace(/\?channel_binding=require&?/g, "?")
    .replace(/\?$/g, "");
}

function parseCopySections(sql) {
  const sections = new Map();
  const lines = sql.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^COPY public\.([a-z_]+) \((.+)\) FROM stdin;$/);
    if (!match) continue;

    const table = match[1];
    if (!targetTables.includes(table)) continue;

    const columns = match[2]
      .split(/,\s*/)
      .map((column) => column.replace(/^"|"$/g, ""));
    const rows = [];

    i += 1;
    while (i < lines.length && lines[i] !== "\\.") {
      if (lines[i]) rows.push(lines[i]);
      i += 1;
    }

    sections.set(table, { columns, rows });
  }

  return sections;
}

function decodeCopyValue(value) {
  if (value === "\\N") return null;
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\t/g, "\t")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\v/g, "\v");
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function insertRows(client, table, section) {
  if (!section || section.rows.length === 0) return 0;

  const columns = section.columns;
  const tableName = `public.${quoteIdent(table)}`;
  const columnList = columns.map(quoteIdent).join(", ");
  let inserted = 0;

  for (const line of section.rows) {
    const values = line.split("\t").map(decodeCopyValue);
    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");

    if (table === "users") {
      const orgIndex = columns.indexOf("organizationId");
      const userValues = [...values];
      if (orgIndex >= 0) userValues[orgIndex] = null;

      await client.query(
        `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        userValues,
      );
    } else {
      await client.query(
        `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values,
      );
    }

    inserted += 1;
  }

  return inserted;
}

async function restore() {
  const sql = readFileSync(dumpPath, "utf8");
  const sections = parseCopySections(sql);
  const pool = new Pool({
    connectionString: connectionUrl(),
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const table of ["users", "categories", "organizations", "courses", "course_modules", "lessons", "enrollments"]) {
      const count = await insertRows(client, table, sections.get(table));
      console.log(`${table}: restored ${count}`);
    }

    const users = sections.get("users");
    if (users) {
      const idIndex = users.columns.indexOf("id");
      const orgIndex = users.columns.indexOf("organizationId");

      if (idIndex >= 0 && orgIndex >= 0) {
        let updated = 0;
        for (const line of users.rows) {
          const values = line.split("\t").map(decodeCopyValue);
          const userId = values[idIndex];
          const organizationId = values[orgIndex];
          if (!userId || !organizationId) continue;
          await client.query(
            'UPDATE public.users SET "organizationId" = $1 WHERE id = $2 AND "organizationId" IS NULL',
            [organizationId, userId],
          );
          updated += 1;
        }
        console.log(`users.organizationId: restored ${updated}`);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

restore().catch((error) => {
  console.error(error);
  process.exit(1);
});
