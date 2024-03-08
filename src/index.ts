import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";

export default class RateLimit {
  windowMs: number;
  limit: number;
  store: Map<any, any>;
  message: string;
  statusCode: number;
  constructor(options: {
    windowMs?: number;
    limit?: number;
    store?: "local";
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
    let record = this.store.get(ip);
    if (!record) {
      record = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(ip, record);
      await next();
    } else {
      if (record.count >= this.limit) {
        return c.text(this.message, this.statusCode as StatusCode);
      }
      record.count++;
      this.store.set(ip, record);
    }
  };
  getIpUsage = (ip: string) => {
    return this.store.get(ip);
  }
  deleteIpUsage = (ip: string) => {
    this.store.delete(ip);
  }
  clear = () => {
    this.store.clear();
  }
}
