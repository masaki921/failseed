import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// プロキシ信頼設定（Replit環境対応）
const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
if (isProduction) {
  app.set('trust proxy', 1);
}

// セキュリティミドルウェア
app.use(helmet({
  contentSecurityPolicy: false, // Vite開発サーバー対応
  crossOriginEmbedderPolicy: false,
}));

// CORS設定
app.use(cors({
  origin: isProduction ? true : ["http://localhost:3000", "http://localhost:5000"],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: isProduction ? 100 : 1000, // 本番環境では厳しく制限
  message: {
    error: "rate_limit_exceeded",
    message: "リクエストが多すぎます。しばらく待ってからもう一度お試しください。"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ボディサイズ制限
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// セッション設定 - セキュリティ強化
if (!process.env.SESSION_SECRET && isProduction) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProduction, // デプロイ環境ではHTTPS必須
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30日
    sameSite: isProduction ? 'none' : 'lax', // クロスサイト対応
    httpOnly: true, // XSS攻撃対策
  },
  name: 'failseed.sid', // セッション名を明示的に設定
  proxy: isProduction, // リバースプロキシ使用時はtrue
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
