import { env } from "../config/env.js";
import logger from "../logger/logger.js";
import ApiError from "../utils/ApiError.js";

// Alag alag tarah ke errors (Mongoose, JWT, Multer) ko
// ek common ApiError shape me convert karta hai.
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err.name === "CastError") return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest("Validation failed", errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return ApiError.conflict(`${field} already exists`);
  }

  if (err.name === "JsonWebTokenError") return ApiError.unauthorized("Invalid token");
  if (err.name === "TokenExpiredError") return ApiError.unauthorized("Token expired");
  if (err.name === "MulterError") return ApiError.badRequest(err.message);

  return new ApiError(err.statusCode || 500, err.message || "Internal Server Error");
}

// Ye function EK jagah hai jahan har error final response bankar jaata hai.
// app.js me ise SABSE LAST me register karna hoga.
export function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);

  logger.error(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}: ${apiError.message}`);

  return res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors || [],
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

// Jab koi aisi URL hit ho jo exist hi nahi karti
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
}