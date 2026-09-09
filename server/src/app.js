import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";

import logger from "./logger/logger.js";
import ApiResponse from "./utils/ApiResponse.js";

import {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  sanitizeMiddleware,
} from "./middlewares/security.middleware.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageStandaloneRoutes from "./routes/messageStandalone.routes.js";
import fileRoutes from "./routes/file.routes.js";
import aiUtilsRoutes from "./routes/aiUtils.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import csvRoutes from "./routes/csv.routes.js";
import memoryRoutes from "./routes/memory.routes.js";
import capabilitiesRoutes from "./routes/capabilities.routes.js";
import visionRoutes from "./routes/vision.routes.js";
import imageGenerationRoutes from "./routes/imageGeneration.routes.js";
import webSearchRoutes from "./routes/webSearch.routes.js";
import placesRoutes from "./routes/places.routes.js";
import voiceRoutes from "./routes/voice.routes.js";
import researchRoutes from "./routes/research.routes.js";
import integrationsRoutes from "./routes/integrations.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportRoutes from "./routes/report.routes.js";

import { env } from "./config/env.js";

const app = express();

// ──────────────────────────────────────────────────────────
// 1. STATIC FILES — served FIRST, before ANY middleware
//    so that CORS / Helmet / rate-limiter never intercept them.
// ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../../client/dist");

// Serve static files with correct MIME types (express.static handles this)
app.use(express.static(clientDist, { maxAge: "1y", immutable: true }));

// Guard: if a request to /assets/* was NOT served by express.static
// (file missing), return a plain 404 instead of falling through
// to the SPA fallback / error-handler (which returns JSON → MIME error).
app.use("/assets", (_req, res) => {
  res.status(404).type("text").send("Asset not found");
});

// ──────────────────────────────────────────────────────────
// 2. SECURITY middleware (only applies to API + SPA routes)
// ──────────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimiter);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Other middleware
app.use(cookieParser());
app.use(compression());
app.use(sanitizeMiddleware);
app.use(morgan("dev", { stream: logger.stream }));

// ──────────────────────────────────────────────────────────
// 3. HEALTH CHECK
// ──────────────────────────────────────────────────────────
const API_BASE = `/api/${env.API_VERSION}`;

app.get(["/health", `${API_BASE}/health`], (req, res) => {
  new ApiResponse(
    200,
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    "Server is healthy"
  ).send(res);
});

// ──────────────────────────────────────────────────────────
// 4. API ROUTES
// ──────────────────────────────────────────────────────────

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/conversations`, conversationRoutes);
app.use(`${API_BASE}/messages`, messageStandaloneRoutes);
app.use(`${API_BASE}/files`, fileRoutes);
app.use(`${API_BASE}/ai`, aiUtilsRoutes);
app.use(`${API_BASE}/analytics`, analyticsRoutes);
app.use(`${API_BASE}/csv`, csvRoutes);
app.use(`${API_BASE}/memory`, memoryRoutes);
app.use(`${API_BASE}/capabilities`, capabilitiesRoutes);
app.use(`${API_BASE}/vision`, visionRoutes);
app.use(`${API_BASE}/image-generation`, imageGenerationRoutes);
app.use(`${API_BASE}/web-search`, webSearchRoutes);
app.use(`${API_BASE}/places`, placesRoutes);
app.use(`${API_BASE}/voice`, voiceRoutes);
app.use(`${API_BASE}/research`, researchRoutes);
app.use(`${API_BASE}/integrations`, integrationsRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/reports`, reportRoutes);

// ──────────────────────────────────────────────────────────
// 5. SPA FALLBACK — only for browser navigation routes,
//    never for API or /assets paths.
// ──────────────────────────────────────────────────────────
app.get("*", (req, res, next) => {
  // Let API 404s fall through to the notFoundHandler below
  if (req.path.startsWith(API_BASE)) {
    return next();
  }
  const indexPath = path.join(clientDist, "index.html");
  if (existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  // index.html doesn't exist yet (build hasn't run)
  return res.status(503).type("text").send("App is starting up — please retry in a moment.");
});

// 404 (API routes only at this point)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
