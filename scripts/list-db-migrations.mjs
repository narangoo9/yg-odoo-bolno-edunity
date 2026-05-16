import "./load-env.mjs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
const { rows } = await client.query(
  `SELECT migration_name, finished_at, checksum
   FROM "_prisma_migrations"
   ORDER BY finished_at`,
);
for (const r of rows) {
  console.log(r.migration_name, r.finished_at?.toISOString?.() ?? r.finished_at);
}
await client.end();
