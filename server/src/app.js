import path from "path";
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

import { env } from "./config/env.js";

const app = express();

// Security
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

// Health check
app.get("/health", (req, res) => {
  new ApiResponse(
    200,
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    "Server is healthy"
  ).send(res);
});

// API base path
const API_BASE = `/api/${env.API_VERSION}`;

// Routes
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



// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith(API_BASE)) {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"));
});
// 404
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
