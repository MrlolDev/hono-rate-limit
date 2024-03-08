# hono-rate-limit

Basic rate-limiting middleware for the Hono.js web server

## Installation

```
npm i hono-rate-limit
```

## Usage

### Import dependencies

```typescript
import { Hono } from "hono";
import RateLimit from "hono-rate-limit";
```

### Configure your rate limit

```typescript
import { Hono } from "hono";
import RateLimit from "hono-rate-limit";

const app = new Hono();

app.use(
  "/*",
  RateLimit({
    windowMs: 2000,
    limit: 1,
    store: "local", // or redis
    message: "Too many requests", // just text supported
    statusCode: 429,
    // redisOptions: { url: 'redis://alice:foobared@awesome.redis.server:6380' }
  })
);

serve({
  fetch: app.fetch,
  port: 3000,
}).addListener("listening", async () => {
  console.log("Server is running on port 3000");
});

export default app;
```
