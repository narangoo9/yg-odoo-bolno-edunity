import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

/**
 * Анхдагч: PrismaClient (Neon / cloud Postgres-ийн pooled DATABASE_URL).
 * `PRISMA_USE_PG_ADAPTER=true` бол @prisma/adapter-pg + `pg` Pool (тусгай тохиргоо).
 */
function createPrismaClient(): PrismaClient {
  const usePgAdapter = process.env.PRISMA_USE_PG_ADAPTER === "true";

  if (usePgAdapter) {
    const pool =
      globalForPrisma.prismaPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 3_000,
        allowExitOnIdle: false,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prismaPool = pool;
    }

    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

process.on("beforeExit", async () => {
  await db.$disconnect();
  if (globalForPrisma.prismaPool) {
    await globalForPrisma.prismaPool.end();
  }
});
