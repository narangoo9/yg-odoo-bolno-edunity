import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = path.join(root, "backups");
const checkOnly = process.argv.includes("--check");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: process.platform === "win32" && (command === "npm" || command === "npx"),
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0 && !options.allowFailure) {
    const stderr = result.stderr ? `\n${result.stderr}` : "";
    throw new Error(`${command} ${args.join(" ")} failed.${stderr}`);
  }

  return (result.stdout || "").trim();
}

function hasGeneratedPrismaClient() {
  return existsSync(path.join(root, "node_modules", ".prisma", "client", "index.js"));
}

function generatePrismaClient() {
  const result = spawnSync("npx", ["prisma", "generate"], {
    cwd: root,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });

  if (result.status === 0) {
    process.stdout.write(result.stdout || "");
    return;
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const isWindowsPermissionIssue =
    process.platform === "win32" &&
    output.includes("EPERM") &&
    output.includes("query_engine-windows.dll.node");

  if (isWindowsPermissionIssue && hasGeneratedPrismaClient()) {
    console.warn(
      "Prisma generate hit a Windows file-lock EPERM, but an existing generated client is present. Continuing.",
    );
    console.warn("Close running dev servers and rerun `npm run db:generate` if Prisma schema changed.");
    return;
  }

  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  throw new Error("npx prisma generate failed.");
}

function psql(sql, options = {}) {
  return run(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-U", "elearn", "-d", "elearn_db", "-tAc", sql],
    { capture: true, ...options },
  );
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function waitForPostgres() {
  for (let i = 0; i < 30; i += 1) {
    const result = run(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "elearn", "-d", "elearn_db"],
      { capture: true, allowFailure: true },
    );

    if (result.includes("accepting connections")) return;
    sleep(1000);
  }

  throw new Error("Postgres did not become ready within 30 seconds.");
}

function getCount(table) {
  const exists = psql(`select to_regclass('public.${table}') is not null;`);
  if (exists !== "t") return null;
  const count = psql(`select count(*) from "${table}";`);
  return Number(count || 0);
}

function latestBackup() {
  if (!existsSync(backupDir)) return null;
  const files = readdirSync(backupDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  return files.at(-1) || null;
}

function backupDatabase() {
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const containerPath = `/tmp/elearn-${stamp}.sql`;
  const localPath = path.join("backups", `elearn-${stamp}.sql`);

  run("docker", [
    "compose",
    "exec",
    "-T",
    "postgres",
    "pg_dump",
    "-U",
    "elearn",
    "-d",
    "elearn_db",
    "-f",
    containerPath,
  ]);
  run("docker", ["compose", "cp", `postgres:${containerPath}`, localPath]);
  run("docker", ["compose", "exec", "-T", "postgres", "rm", "-f", containerPath], {
    allowFailure: true,
  });
  console.log(`Database backup saved: ${localPath}`);
}

console.log("Starting local Postgres and Redis...");
run("docker", ["compose", "up", "-d", "postgres", "redis"]);
waitForPostgres();

console.log("Generating Prisma client...");
generatePrismaClient();

const tableCount = Number(
  psql("select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';") || 0,
);

if (tableCount === 0) {
  console.log("Database has no tables. Applying Prisma schema...");
  run("npx", ["prisma", "db", "push", "--accept-data-loss"]);
}

const userCount = getCount("users");
if (!userCount) {
  const backup = latestBackup();
  if (backup) {
    console.log(`Database has no users. Latest backup available: backups/${backup}`);
  }
  console.log("Database is empty. Seeding demo data...");
  run("npm", ["run", "db:seed"]);
} else {
  console.log(`Database has ${userCount} users. Creating a safety backup before dev start...`);
  backupDatabase();
}

if (checkOnly) {
  console.log("Safe dev check completed.");
} else {
  console.log("Starting Next.js dev server...");
  run("npm", ["run", "dev"]);
}
