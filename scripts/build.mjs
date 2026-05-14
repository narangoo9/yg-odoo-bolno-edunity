import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: process.platform === "win32",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env,
    encoding: "utf8",
  });

  return result;
}

function hasGeneratedPrismaClient() {
  return existsSync(path.join(root, "node_modules", ".prisma", "client", "index.js"));
}

const generate = run("npx", ["prisma", "generate"], { capture: true });

if (generate.status !== 0) {
  const output = `${generate.stdout ?? ""}\n${generate.stderr ?? ""}`;
  const isWindowsPermissionIssue =
    process.platform === "win32" &&
    output.includes("EPERM") &&
    output.includes("query_engine-windows.dll.node");

  if (isWindowsPermissionIssue && hasGeneratedPrismaClient()) {
    console.warn(
      "[build] Prisma generate hit a Windows file-lock EPERM, but an existing generated client is present. Continuing to Next build.",
    );
    console.warn("[build] Close running dev servers and rerun `npm run db:generate` if Prisma schema changed.");
  } else if (process.platform === "win32" && output.trim().length === 0 && hasGeneratedPrismaClient()) {
    console.warn(
      "[build] Prisma generate exited without output on Windows, but an existing generated client is present. Continuing to Next build.",
    );
    console.warn("[build] Run `npx prisma generate` directly if the Next build reports Prisma client issues.");
  } else {
    process.stdout.write(generate.stdout ?? "");
    process.stderr.write(generate.stderr ?? "");
    process.exit(generate.status ?? 1);
  }
} else {
  process.stdout.write(generate.stdout ?? "");
}

const build = run("npx", ["next", "build"]);
process.exit(build.status ?? 1);
