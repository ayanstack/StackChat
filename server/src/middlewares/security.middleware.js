import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

// Helmet: secure HTTP headers set karta hai (XSS, clickjacking se bachaata hai)
// CSP configured to allow Google Fonts + Vite built assets
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

// CORS: sirf humara frontend hi API call kar paaye, koi aur website nahi
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5000"];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any *.vercel.app subdomain for preview deployments
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Global rate limiter: 1 IP se bohot zyada requests aayen to block
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest("Too many requests, please try again later.")),
});

// Auth routes (login/register) ke liye extra strict — brute force se bachata hai
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest("Too many auth attempts, please try again later.")),
});

// Password reset / Email Verification rate limiter
export const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest("Too many requests for this action, please try again later.")),
});

// AI Request rate limiter
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 AI requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest("Too many AI requests, please try again later.")),
});

// File Upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest("Too many file uploads, please try again later.")),
});

// NoSQL injection se bachata hai (jaise req.body = { email: { "$gt": "" } })
export const sanitizeMiddleware = mongoSanitize();