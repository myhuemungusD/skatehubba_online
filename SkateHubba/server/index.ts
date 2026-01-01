import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const distDir = path.resolve(process.cwd(), "dist");
const publicDir = path.join(distDir, "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { extensions: ["html"], maxAge: "1d" }));
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  if (req.method !== "GET" || !fs.existsSync(publicDir)) {
    return next();
  }

  const entryPoint = path.join(publicDir, "index.html");
  if (fs.existsSync(entryPoint)) {
    return res.sendFile(entryPoint);
  }

  return next();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Avoid leaking internals in responses
  process.stderr.write(`Unhandled error: ${err.message}\n`);
  res.status(500).json({ error: "Internal Server Error" });
});

export function start() {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  return app.listen(port, host, () => {
    process.stdout.write(`SkateHubba server listening on http://${host}:${port}\n`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default app;
