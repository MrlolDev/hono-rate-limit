import { Context, MiddlewareHandler } from "hono";
import { StatusCode } from "hono/utils/http-status";
import redis from "redis";

export default function RateLimit(options: {
  windowMs?: number;
  limit?: number;
  store?: "local" | "redis";
  redisOptions?: redis.RedisClientOptions;
  message?: string;
  statusCode?: number;
}): MiddlewareHandler {
  if (!options.windowMs) options.windowMs = 60000; // 1 minute
  if (!options.limit) options.limit = 30; // 3 requests
  const windowMs = options.windowMs;
  const limit = options.limit;
  let store;
  if (!options.store) options.store = "local";
  if (options.store === "local") {
    store = new Map();
  }
  if (options.store === "redis") {
    const redisClient = redis.createClient(options.redisOptions);
    store = {
      get: async (key: string) => {
        let record = await redisClient.get(key);
        if (record) {
          return JSON.parse(record);
        }
      },
      set: async (key: string, value: any) => {
        await redisClient.setEx(key, windowMs / 1000, JSON.stringify(value));
      },
      delete: async (key: string) => {
        await redisClient.del(key);
      },
    };
  }
  if (!options.message) options.message = "Too many requests";
  if (!options.statusCode) options.statusCode = 429;
  const message = options.message;
  const statusCode = options.statusCode;
  async function middleware(c: Context, next: () => Promise<void>) {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      "IP not available";
    const now = Date.now();
    let record = await store.get(ip);
    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      await store.set(ip, record);
      await next();
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        await store.set(ip, record);
        await next();
      } else if (record.count >= limit) {
        return c.text(message, statusCode as StatusCode);
      } else {
        record.count++;
        await store.set(ip, record);
        await next();
      }
    }
  }
  return middleware;
}
