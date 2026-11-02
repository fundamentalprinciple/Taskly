import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";
import { redisConnection } from "../queue/connection.js";

const cacheRedis = new Redis(redisConnection as RedisOptions);

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await cacheRedis.get(key);

    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    // Fall back to the database when Redis is unavailable.
    return loader();
  }

  const value = await loader();

  try {
    await cacheRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    // Cache failures must not affect API availability.
  }

  return value;
}

export async function deleteCacheKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    await cacheRedis.del(...keys);
  } catch {
    // Cache invalidation failures must not affect API availability.
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await cacheRedis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await cacheRedis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Cache invalidation failures must not affect API availability.
  }
}
