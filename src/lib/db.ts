import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

const TRANSIENT_ERROR_PATTERNS = [
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ECONNREFUSED",
  "Connection terminated",
  "connection forcibly closed",
  "forcibly closed by the remote host",
  "Closed connection",
  "kind: Closed",
  "Error in PostgreSQL connection",
  "Server has closed the connection",
];

function isNeonPooledUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("neon.tech") && (url.includes("-pooler") || url.includes("pgbouncer=true"));
}

function shouldUsePgAdapter(): boolean {
  if (env.prismaUsePgAdapter === "true") return true;
  if (env.prismaUsePgAdapter === "false") return false;
  return isNeonPooledUrl(env.databaseUrl);
}

function isTransientConnectionError(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  if (!message) return false;
  return TRANSIENT_ERROR_PATTERNS.some((p) => message.includes(p));
}

// Sleep helper for retry backoff.
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Анхдагч: PrismaClient (Neon / cloud Postgres-ийн pooled DATABASE_URL).
 * `PRISMA_USE_PG_ADAPTER=true` бол @prisma/adapter-pg + `pg` Pool (тусгай тохиргоо).
 */
function createPrismaClient(): PrismaClient {
  const usePgAdapter = shouldUsePgAdapter();

  let base: PrismaClient;
  if (usePgAdapter) {
    const pool =
      globalForPrisma.prismaPool ??
      new Pool({
        connectionString: env.databaseUrl,
        max: env.isProduction ? 10 : 5,
        idleTimeoutMillis: 20_000,
        connectionTimeoutMillis: 15_000,
        allowExitOnIdle: true,
      });

    pool.on("error", (err) => {
      if (env.nodeEnv === "development") {
        console.warn("[db] pg pool connection error (will retry on next query):", err.message);
      }
    });

    globalForPrisma.prismaPool = pool;

    const adapter = new PrismaPg(pool);
    base = new PrismaClient({
      adapter,
      log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
    });
  } else {
    base = new PrismaClient({
      log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
    });
  }

  // Retry transient connection-reset errors. Neon can drop idle connections
  // (Windows ECONNRESET / code 10054). One quick retry resolves >95% of cases.
  return base.$extends({
    name: "neon-retry",
    query: {
      $allOperations: async ({ args, query }) => {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            const transient =
              isTransientConnectionError(error) ||
              (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P1017") ||
              (error instanceof Prisma.PrismaClientUnknownRequestError &&
                isTransientConnectionError(error)) ||
              error instanceof Prisma.PrismaClientInitializationError;
            if (!transient || attempt === 2) throw error;
            await sleep(50 * (attempt + 1));
          }
        }
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = db;
}
