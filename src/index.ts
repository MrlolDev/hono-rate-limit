import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";
import redis from "redis";

export default class RateLimit {
  windowMs: number;
  limit: number;
  store:
    | Map<any, any>
    | {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
  message: string;
  statusCode: number;
  constructor(options: {
    windowMs?: number;
    limit?: number;
    store?: "local" | "redis";
    redisOptions?: redis.RedisClientOptions;
    message?: string;
    statusCode?: number;
  }) {
    if (!options.windowMs) options.windowMs = 60000; // 1 minute
    if (!options.limit) options.limit = 30; // 3 requests
    this.windowMs = options.windowMs;
    this.limit = options.limit;
    if (!options.store) options.store = "local";
    if (options.store === "local") {
      this.store = new Map();
    }
    if (options.store === "redis") {
      const redisClient = redis.createClient(options.redisOptions);
      this.store = {
        get: async (key: string) => {
          let record = await redisClient.get(key);
          if (record) {
            return JSON.parse(record);
          }
        },
        set: async (key: string, value: any) => {
          await redisClient.setEx(
            key,
            this.windowMs / 1000,
            JSON.stringify(value)
          );
        },
        delete: async (key: string) => {
          await redisClient.del(key);
        },
      };
    }
    if (!options.message) options.message = "Too many requests";
    if (!options.statusCode) options.statusCode = 429;
    this.message = options.message;
    this.statusCode = options.statusCode;
  }
  middleware = async (c: Context, next: () => Promise<void>) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      "IP not available";
    const now = Date.now();
    let record = await this.store.get(ip);
    if (!record) {
      record = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      await this.store.set(ip, record);
      await next();
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + this.windowMs;
        await this.store.set(ip, record);
        await next();
      } else if (record.count >= this.limit) {
        return c.text(this.message, this.statusCode as StatusCode);
      } else {
        record.count++;
        await this.store.set(ip, record);
        await next();
      }
    }
  };
  getIpUsage = async (ip: string) => {
    return await this.store.get(ip);
  };
  deleteIpUsage = async (ip: string) => {
    await this.store.delete(ip);
  };
}
