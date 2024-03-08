# hono-rate-limit
Basic rate-limiting middleware for the Hono.js web server

## Installation
```
npm i hono-rate-limit
```

## Usage
### Import dependencies
```typescript
import { Hono } from 'hono'
import RateLimit from 'hono-rate-limit'
```

### Configure your rate limit
#### Local storage
```typescript
const honoRateLimit = new RateLimit({
    windowMs: 2000,
    limit: 1, 
    store: "local",
    message:  "Too many requests", // just text supported
    statusCode: 429,
})
```
#### Redis storage
```typescript
const honoRateLimit = new RateLimit({
    windowMs: 2000,
    limit: 1, 
    store: "redis",
    message:  "Too many requests", // just text supported
    statusCode: 429,
    redisOptions: {
        url: 'redis://alice:foobared@awesome.redis.server:6380'
    }
})
```

### Set up the rate limit middleware
```typescript
const app = new Hono()

app.use('/*', honoRateLimit.middleware())
```

## Full-code examples
```typescript
import { Hono } from 'hono'
import RateLimit from 'hono-rate-limit'

const honoRateLimit = new RateLimit({
    windowMs: 2000,
    limit: 1, 
    store: "local", // request more options on the repo issues page.
    message:  "Too many requests", // just text supported
    statusCode: 429
})

const app = new Hono()

app.use('/*', honoRateLimit.middleware())
```