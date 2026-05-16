import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node prisma-migration-checksum.mjs path/to/migration.sql");
  process.exit(1);
}
const checksum = createHash("sha256").update(readFileSync(file)).digest("hex");
console.log(checksum);
