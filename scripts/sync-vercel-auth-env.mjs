/**
 * Sync auth-related env vars to Vercel production (edunity project).
 * Usage: node scripts/sync-vercel-auth-env.mjs
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const PROD_URL = "https://edunity-nu.vercel.app";
const FROM_ENV = [
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function setVercelEnv(name, value) {
  if (!value) {
    console.warn(`skip ${name} (empty)`);
    return;
  }
  try {
    execSync(`npx vercel env rm ${name} production --yes`, { stdio: "ignore" });
  } catch {
    /* may not exist */
  }
  execSync(`npx vercel env add ${name} production`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`set ${name}`);
}

const local = parseEnv(readFileSync(".env", "utf8"));

setVercelEnv("NEXTAUTH_URL", PROD_URL);
setVercelEnv("AUTH_URL", PROD_URL);
setVercelEnv("NEXT_PUBLIC_APP_URL", PROD_URL);

for (const key of FROM_ENV) {
  setVercelEnv(key, local[key]);
}

console.log("\nDone. Add this redirect URI in Google Cloud Console:");
console.log(`${PROD_URL}/api/auth/callback/google`);
console.log("\nThen redeploy: npx vercel deploy --prod --yes");
