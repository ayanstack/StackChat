import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import { authRateLimiter } from "../middlewares/security.middleware.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.validation.js";

const router = Router();

// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

// =====================================================
// REFRESH TOKEN
// =====================================================

router.post(
  "/refresh-token",
  authController.refreshToken
);

// =====================================================
// LOGOUT
// =====================================================

router.post(
  "/logout",
  authController.logout
);

// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// =====================================================
// SEND VERIFICATION EMAIL
// =====================================================

router.post(
  "/send-verification-email",
  verifyJWT,
  authController.sendVerificationEmail
);

// =====================================================
// VERIFY EMAIL
// =====================================================

router.get(
  "/verify-email",
  authController.verifyEmail
);

// =====================================================
// CURRENT USER
// =====================================================

router.get(
  "/me",
  verifyJWT,
  authController.getCurrentUser
);

export default router;