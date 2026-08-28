import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../helpers/tokenHelper.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized(
      "Access token missing. Please log in."
    );
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized(
      "Access token missing. Please log in."
    );
  }

  let decoded;

  // Verify JWT
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw ApiError.unauthorized(
      "Invalid or expired access token"
    );
  }

  // Get user ID from token
  const userId =
    decoded.userId ||
    decoded.id ||
    decoded._id;

  if (!userId) {
    throw ApiError.unauthorized(
      "Invalid access token"
    );
  }

  // Find user
  const user = await User.findById(userId).select(
    "-password -passwordResetToken -passwordResetExpires"
  );

  if (!user) {
    throw ApiError.unauthorized(
      "User no longer exists"
    );
  }

  // Check deleted account
  if (user.isDeleted) {
    throw ApiError.forbidden(
      "This account has been deactivated"
    );
  }

  // Attach authenticated user
  req.user = user;

  // Continue to next middleware / route
  next();
});

// ------------------------------------
// Role Authorization Middleware
// ------------------------------------

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized(
        "Authentication required"
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to perform this action"
      );
    }

    next();
  };
};