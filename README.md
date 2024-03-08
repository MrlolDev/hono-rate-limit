# hono-rate-limit
Basic rate-limiting middleware for the Hono.js web server

## Installation
```
npm i hono-rate-limit
```

## Usage
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