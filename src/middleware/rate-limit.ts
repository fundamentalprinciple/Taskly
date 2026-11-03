import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";
import { redisConnection } from "../queue/connection.js";
import { verifyAccessToken } from "../modules/auth/token.js";

const redis = new Redis(redisConnection as RedisOptions);

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local maxRequests = tonumber(ARGV[2])
local member = ARGV[3]

local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local windowStart = now - window

redis.call("ZREMRANGEBYSCORE", key, "-inf", windowStart)

local count = redis.call("ZCARD", key)

if count >= maxRequests then
  local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
  local retryAfter = tonumber(oldest[2]) + window - now
  redis.call("PEXPIRE", key, window)
  return {0, 0, retryAfter, tonumber(oldest[2]) + window}
end

redis.call("ZADD", key, now, member)
redis.call("PEXPIRE", key, window)

local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
local resetAt = tonumber(oldest[2]) + window

return {1, maxRequests - count - 1, 0, resetAt}
`;

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let identifier: string;

  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authorization.slice(7));
      identifier = `user:${payload.sub}`;
    } catch {
      identifier = `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
    }
  } else {
    identifier = `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
  }

  try {
    const result = (await redis.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      `rate-limit:${identifier}`,
      WINDOW_MS,
      MAX_REQUESTS,
      randomUUID(),
    )) as [number, number, number, number];

    const [allowed, remaining, retryAfterMs, resetAt] = result;

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000));

    if (allowed === 0) {
      const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));

      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        error: "Too many requests",
        retryAfter,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Rate limiter Redis error:", error);
    res.status(503).json({ error: "Rate limiting service unavailable" });
  }
}
