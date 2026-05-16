import "./load-env.mjs";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL is not set in .env");
  process.exit(1);
}

const out = execSync(
  `npx prisma migrate diff --from-url "${directUrl.replace(/"/g, '\\"')}" --to-schema-datamodel prisma/schema.prisma --script`,
  { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);

writeFileSync("prisma/schema-sync-to-db.sql", out);
console.log(`Wrote prisma/schema-sync-to-db.sql (${out.length} bytes)`);
console.log(out.slice(0, 4000));
if (out.length > 4000) console.log("\n... (see full file)");
