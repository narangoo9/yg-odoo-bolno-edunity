import IORedis from "ioredis";
import { env } from "@/lib/env";

const redisUrl = env.redisUrl;

const globalForRedis = globalThis as unknown as {
  redis?: IORedis | null;
  rateLimitMemory?: Map<string, number[]>;
};

export const redis =
  globalForRedis.redis ??
  (redisUrl
    ? new IORedis(redisUrl, {
        connectTimeout: 500,
        commandTimeout: 700,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      })
    : null);

if (!env.isProduction) globalForRedis.redis = redis;

export const RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "Service temporarily unavailable. Please try again later.";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: Date;
  unavailable?: boolean;
};

const memoryRateLimitStore =
  globalForRedis.rateLimitMemory ?? new Map<string, number[]>();

globalForRedis.rateLimitMemory = memoryRateLimitStore;

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const hits = (memoryRateLimitStore.get(key) ?? []).filter((hit) => hit > windowStart);

  if (hits.length >= limit) {
    const oldestHit = hits[0] ?? now;
    memoryRateLimitStore.set(key, hits);
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(oldestHit + windowSeconds * 1000),
    };
  }

  hits.push(now);
  memoryRateLimitStore.set(key, hits);

  return {
    success: true,
    remaining: limit - hits.length,
    resetAt: new Date(now + windowSeconds * 1000),
  };
}

/**
 * Generic cache wrapper.
 * Usage:
 *   const courses = await cached("courses:popular", 300, () => getPopularCourses());
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) return fetcher();

  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    console.error("Cache read error:", err);
  }

  const result = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return result;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      for (let i = 0; i < keysToDelete.length; i += 100) {
        await redis.del(...keysToDelete.slice(i, i + 100));
      }
    }
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }
}

// Rate limiting helper
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
  strategy: "fail-open" | "fail-closed" = "fail-open"
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  if (!redis) {
    if (!env.isProduction) {
      console.warn("[rate-limit] Redis is unavailable; using in-memory development limiter.");
    } else if (strategy === "fail-closed") {
      console.error("[rate-limit] Redis is unavailable; using in-memory fallback for sensitive limiter.");
    }

    return memoryRateLimit(key, limit, windowSeconds);
  }

  try {
    await redis.zremrangebyscore(key, 0, windowStart);
    const count = await redis.zcard(key);

    if (count >= limit) {
      const oldestScores = await redis.zrange(key, 0, 0, "WITHSCORES");
      const resetAt = oldestScores[1]
        ? new Date(Number(oldestScores[1]) + windowSeconds * 1000)
        : new Date(now + windowSeconds * 1000);
      return { success: false, remaining: 0, resetAt };
    }

    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, windowSeconds);

    return {
      success: true,
      remaining: limit - count - 1,
      resetAt: new Date(now + windowSeconds * 1000),
    };
  } catch (error) {
    console.error("[rate-limit] Redis error:", error);

    if (strategy === "fail-closed") {
      console.error("[rate-limit] Redis failed; using in-memory fallback for sensitive limiter.");
    }

    return memoryRateLimit(key, limit, windowSeconds);
  }
}

export async function sensitiveRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return rateLimit(identifier, limit, windowSeconds, "fail-closed");
}
