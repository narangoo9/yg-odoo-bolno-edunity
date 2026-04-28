import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const redisClient = redis;
  const redisEnabled = Boolean(redisClient);

  const checks = await Promise.allSettled([
    db.$queryRaw`SELECT 1`.then(() => "ok"),
    redisClient ? redisClient.ping().then(() => "ok") : Promise.resolve("disabled"),
  ]);

  const [dbCheck, redisCheck] = checks;

  const status = {
    status:
      dbCheck.status === "fulfilled" &&
      (!redisEnabled || redisCheck.status === "fulfilled")
        ? "healthy"
        : "degraded",
    timestamp: new Date().toISOString(),
    latency_ms: Date.now() - start,
    version: process.env.npm_package_version ?? "unknown",
    checks: {
      database: dbCheck.status === "fulfilled" ? "ok" : "error",
      redis: redisEnabled
        ? redisCheck.status === "fulfilled"
          ? "ok"
          : "error"
        : "disabled",
    },
  };

  const httpStatus = status.status === "healthy" ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
