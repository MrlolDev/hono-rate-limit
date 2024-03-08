import { Hono } from "hono";
import RateLimit from "../dist/index.js";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
  "/*",
  RateLimit({
    windowMs: 2000,
    limit: 1,
    store: "local", // request more options on the repo issues page.
    message: "Too many requests", // just text supported
    statusCode: 429,
  })
);

app.get("/", (ctx) => {
  return ctx.text("Hello World");
});

serve({
  fetch: app.fetch,
  port: 3000,
}).addListener("listening", async () => {
  console.log("Server is running on port 3000");
});

export default app;
