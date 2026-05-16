import "./load-env.mjs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
const { rows } = await client.query(
  `SELECT migration_name, checksum FROM "_prisma_migrations"
   WHERE migration_name LIKE '20260511%' OR migration_name LIKE '20260508%' OR migration_name LIKE '20260515%'
   ORDER BY migration_name`,
);
console.log(JSON.stringify(rows, null, 2));
await client.end();
