import "./load-env.mjs";
import { execSync } from "node:child_process";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL is not set in .env");
  process.exit(1);
}

const out = execSync(
  `npx prisma migrate diff --from-migrations prisma/migrations --to-url "${directUrl.replace(/"/g, '\\"')}" --script`,
  { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);

console.log(out.slice(0, 8000));
if (out.length > 8000) console.log("\n... (truncated, full output saved to prisma/drift-from-migrations-to-db.sql)");

import { writeFileSync } from "node:fs";
writeFileSync("prisma/drift-from-migrations-to-db.sql", out);
