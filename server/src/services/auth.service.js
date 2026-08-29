import crypto from "crypto";

import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import ApiError from "../utils/ApiError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../helpers/tokenHelper.js";

import { env } from "../config/env.js";
import { sendEmail } from "../utils/email.js";
import logger from "../logger/logger.js";
import notificationService from "./notification.service.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// =====================================================
// REGISTER
// =====================================================

async function register({ name, email, password }, meta = {}) {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw ApiError.conflict(
      "An account with this email already exists"
    );
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
  });

  const tokens = await issueTokens(user, meta);

  return {
    user: user.toSafeObject(),
    ...tokens,
  };
}

// =====================================================
// LOGIN
// =====================================================

async function login({ email, password }, meta = {}) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    try {
      const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-bottom: 8px;">⚠️ Security Alert: Login Attempt</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">StackChat Account Protection</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">We detected a login attempt using your email address on <strong>StackChat</strong>.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Time:</strong> ${timeString}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>IP Address:</strong> ${meta.ip || "Unknown"}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Device / Browser:</strong> ${meta.userAgent || "Unknown"}</p>
          </div>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">If you do not have an account or did not attempt to sign in, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
        </div>
      `;

      setImmediate(async () => {
        try {
          await sendEmail(
            normalizedEmail,
            "Security Alert: Login Attempt - StackChat",
            emailHtml
          );
        } catch (mailErr) {
          logger.error(`Failed to send security alert email for unregistered user: ${mailErr.message}`);
        }
      });
    } catch (err) {
      logger.error(`Error constructing email: ${err.message}`);
    }

    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.isDeleted) {
    throw ApiError.forbidden(
      "This account has been deactivated"
    );
  }

  // Google-only account
  if (!user.password) {
    throw ApiError.unauthorized(
      "This account uses Google Login. Please continue with Google."
    );
  }

  const isPasswordCorrect =
    await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // 1. Create in-app notification for the user
    try {
      await notificationService.createNotification(user._id, {
        title: "Security Alert: Failed Login Attempt",
        message: `An unsuccessful login attempt was detected on your account from IP ${meta.ip || "unknown"}.`,
        type: "warning",
      });
    } catch (notifErr) {
      logger.error(`Failed to create in-app notification on failed login: ${notifErr.message}`);
    }

    // 2. Send security alert email to user's Gmail (Awaited to guarantee delivery)
    try {
      const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-bottom: 8px;">⚠️ Security Alert: Failed Login Attempt</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">StackChat Account Protection</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name || "User"}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">We detected an unsuccessful login attempt to your StackChat account with an incorrect password.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Time:</strong> ${timeString}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>IP Address:</strong> ${meta.ip || "Unknown"}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>Device / Browser:</strong> ${meta.userAgent || "Unknown"}</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">If this was you, please ensure you enter your correct password or use the <strong>Forgot Password?</strong> feature on the sign-in screen.</p>
          <p style="color: #dc2626; font-size: 14px; line-height: 1.5; font-weight: bold;">If you did not make this attempt, someone else may be trying to access your account. We recommend resetting your password immediately.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
        </div>
      `;

      setImmediate(async () => {
        try {
          await sendEmail(
            user.email,
            "Security Alert: Failed Login Attempt - StackChat",
            emailHtml
          );
        } catch (mailErr) {
          logger.error(`Failed to send security alert email: ${mailErr.message}`);
        }
      });
    } catch (err) {
      logger.error(`Error constructing security alert email: ${err.message}`);
    }

    throw ApiError.unauthorized(
      "Invalid email or password"
    );
  }

  const tokens = await issueTokens(user, meta);

  return {
    user: user.toSafeObject(),
    ...tokens,
  };
}

// =====================================================
// GOOGLE LOGIN
// =====================================================

async function googleLogin(
  { googleId, email, name, avatar },
  meta = {}
) {
  if (!googleId || !email) {
    throw ApiError.badRequest(
      "Google account information is incomplete"
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user = await User.findOne({
    $or: [
      { googleId },
      { email: normalizedEmail },
    ],
  });

  // Existing user
  if (user) {
    if (user.isDeleted) {
      throw ApiError.forbidden(
        "This account has been deactivated"
      );
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.avatar?.url && avatar) {
      user.avatar = {
        url: avatar,
        publicId: "",
      };
    }

    user.isEmailVerified = true;

    await user.save();
  }

  // New Google user
  else {
    user = await User.create({
      name: name || "Google User",
      email: normalizedEmail,
      googleId,
      avatar: {
        url: avatar || "",
        publicId: "",
      },
      isEmailVerified: true,
    });
  }

  const tokens = await issueTokens(user, meta);

  return {
    user: user.toSafeObject(),
    ...tokens,
  };
}

// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

async function refreshAccessToken(incomingToken) {
  if (!incomingToken) {
    throw ApiError.unauthorized(
      "Refresh token missing"
    );
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch {
    throw ApiError.unauthorized(
      "Invalid or expired refresh token"
    );
  }

  const hashedIncomingToken = crypto
    .createHash("sha256")
    .update(incomingToken)
    .digest("hex");

  const storedToken = await RefreshToken.findOne({
    token: hashedIncomingToken,
    user: decoded.userId,
  });

  if (
    !storedToken ||
    storedToken.isRevoked ||
    storedToken.expiresAt < new Date()
  ) {
    throw ApiError.unauthorized(
      "Refresh token is no longer valid, please log in again"
    );
  }

  const user = await User.findById(decoded.userId);

  if (!user || user.isDeleted) {
    throw ApiError.unauthorized(
      "User no longer exists"
    );
  }

  storedToken.isRevoked = true;

  await storedToken.save();

  const tokens = await issueTokens(user);

  return tokens;
}

// =====================================================
// LOGOUT
// =====================================================

async function logout(incomingToken) {
  if (!incomingToken) {
    return;
  }

  const hashedIncomingToken = crypto
    .createHash("sha256")
    .update(incomingToken)
    .digest("hex");

  await RefreshToken.findOneAndUpdate(
    {
      token: hashedIncomingToken,
    },
    {
      isRevoked: true,
    }
  );
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

async function forgotPassword(email) {
  if (!email || typeof email !== "string") {
    throw ApiError.badRequest(
      "Email is required"
    );
  }

  const normalizedEmail =
    email.toLowerCase().trim();

  console.log(
    "========================================"
  );

  console.log(
    "🔐 FORGOT PASSWORD REQUEST"
  );

  console.log(
    "Email:",
    normalizedEmail
  );

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: false,
  });

  // Security:
  // Never reveal whether an email exists.
  if (!user) {
    console.log(
      "⚠️ No active user found for this email"
    );

    console.log(
      "========================================"
    );

    return {
      message:
        "If that email exists, a reset link has been sent.",
    };
  }

  console.log(
    "✅ User found:",
    user._id.toString()
  );

  // Generate raw token
  const rawToken =
    crypto.randomBytes(32).toString("hex");

  // Hash token before saving
  const hashedToken =
    crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

  user.passwordResetToken = hashedToken;

  // 15 minute expiry
  user.passwordResetExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  await user.save({
    validateBeforeSave: false,
  });

  console.log(
    "✅ Password reset token saved"
  );

  console.log(
    "Token expires:",
    user.passwordResetExpires
  );

  // Create reset URL
  const resetUrl =
    `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  console.log(
    "🔗 Reset URL:",
    resetUrl
  );

  // Email HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset - StackChat</title>
</head>

<body style="
  margin:0;
  padding:30px;
  background:#f5f5f5;
  font-family:Arial,sans-serif;
">

  <div style="
    max-width:600px;
    margin:auto;
    background:#ffffff;
    padding:30px;
    border-radius:10px;
  ">

    <h2>Password Reset Request</h2>

    <p>
      Hello ${user.name || "User"},
    </p>

    <p>
      You requested to reset your StackChat password.
    </p>

    <p>
      Click the button below to create a new password:
    </p>

    <p>
      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#000000;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
        "
      >
        Reset Password
      </a>
    </p>

    <p>
      This password reset link will expire in
      <strong>15 minutes</strong>.
    </p>

    <p>
      If you did not request a password reset,
      you can safely ignore this email.
    </p>

    <hr />

    <p>
      <strong>StackChat</strong>
    </p>

  </div>

</body>
</html>
`;

  console.log(
    "📧 Calling sendEmail()..."
  );

  const emailSent = await sendEmail(
    user.email,
    "Password Reset - StackChat",
    html
  );

  console.log(
    "📧 Email result:",
    emailSent
  );

  // Email failed
  if (!emailSent) {
    console.log(
      "❌ Password reset email failed"
    );

    // Remove reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    throw ApiError.internal(
      "Failed to send password reset email. Please check server email configuration."
    );
  }

  console.log(
    "✅ PASSWORD RESET EMAIL SENT SUCCESSFULLY"
  );

  console.log(
    "========================================"
  );

  return {
    message:
      "If that email exists, a reset link has been sent.",
  };
}

// =====================================================
// RESET PASSWORD
// =====================================================

async function resetPassword(
  rawToken,
  newPassword
) {
  if (!rawToken) {
    throw ApiError.badRequest(
      "Reset token is required"
    );
  }

  if (!newPassword) {
    throw ApiError.badRequest(
      "New password is required"
    );
  }

  const hashedToken =
    crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,

    passwordResetExpires: {
      $gt: new Date(),
    },

    isDeleted: false,
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw ApiError.badRequest(
      "Reset token is invalid or has expired"
    );
  }

  user.password = newPassword;

  user.passwordResetToken = undefined;

  user.passwordResetExpires = undefined;

  await user.save();

  // Revoke all existing refresh tokens
  await RefreshToken.updateMany(
    {
      user: user._id,
    },
    {
      isRevoked: true,
    }
  );

  return {
    message:
      "Password has been reset successfully",
  };
}

// =====================================================
// SEND VERIFICATION EMAIL
// =====================================================

async function sendVerificationEmail(userId) {
  console.log("========================================");
  console.log("📧 VERIFY EMAIL REQUEST");
  console.log("User ID:", userId);

  const user = await User.findById(userId);

  if (!user) {
    console.log("⚠️ User not found");
    console.log("========================================");
    throw ApiError.notFound(
      "User not found"
    );
  }

  console.log("Email:", user.email);

  if (user.isEmailVerified) {
    console.log("⚠️ Email is already verified");
    console.log("========================================");
    return {
      message:
        "Email is already verified",

      alreadyVerified: true,
    };
  }

  const rawToken =
    crypto.randomBytes(32).toString("hex");

  console.log("Token generated: [HIDDEN]");

  const hashedToken =
    crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.markModified("emailVerificationToken");
  user.markModified("emailVerificationExpires");

  await user.save({
    validateBeforeSave: false,
  });

  console.log("Token saved: ✅");
  console.log("Token expires:", user.emailVerificationExpires);

  const verifyUrl =
    `${env.BACKEND_URL}/api/${env.API_VERSION}/auth/verify-email?token=${rawToken}`;

  const html = `
    <h2>Verify Your Email</h2>

    <p>
      Welcome to StackChat!
    </p>

    <p>
      Click the link below to verify your email address:
    </p>

    <a href="${verifyUrl}">
      Verify Email
    </a>

    <p>
      This link will expire in 24 hours.
    </p>
  `;

  const emailSent =
    await sendEmail(
      user.email,
      "Verify your email - StackChat",
      html
    );

  console.log("Email sent:", emailSent ? "✅" : "❌");
  console.log("========================================");

  if (!emailSent) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw ApiError.internal(
      "Failed to send verification email. Please try again later."
    );
  }

  return {
    message:
      "Verification email sent. Check your inbox.",
  };
}

// =====================================================
// VERIFY EMAIL
// =====================================================

async function verifyEmail(rawToken) {
  console.log("========================================");
  console.log("[VERIFY EMAIL DEBUG] EXECUTION STARTED");

  console.log("Received token exists:", !!rawToken);
  console.log("Received token length:", rawToken ? rawToken.length : 0);

  if (!rawToken) {
    console.log("❌ No token provided");
    console.log("========================================");
    throw ApiError.badRequest(
      "Verification token is required"
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  console.log("Hashed token:", hashedToken);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  }).select(
    "+emailVerificationToken +emailVerificationExpires"
  );

  console.log("User found:", !!user);

  if (!user) {
    console.log("❌ Token not found in database (may be consumed or invalid)");
    console.log("========================================");
    throw ApiError.badRequest(
      "Verification token is invalid or has expired"
    );
  }

  console.log("Stored token exists:", !!user.emailVerificationToken);
  console.log("Token expiry:", user.emailVerificationExpires);
  console.log("Current time:", new Date());

  const isExpired = user.emailVerificationExpires <= new Date();
  console.log("Token expired:", isExpired);

  if (isExpired) {
    console.log("❌ Token has expired");
    console.log("========================================");
    throw ApiError.badRequest(
      "Verification token is invalid or has expired"
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({
    validateBeforeSave: false,
  });

  console.log("✅ Verification successful for:", user.email);
  console.log("========================================");

  return {
    message: "Email verified successfully",
  };
}

// =====================================================
// ISSUE TOKENS
// =====================================================

async function issueTokens(
  user,
  meta = {}
) {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };

  const accessToken =
    generateAccessToken(payload);

  const refreshToken =
    generateRefreshToken(payload);

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await RefreshToken.create({
    user: user._id,

    token: hashedRefreshToken,

    userAgent:
      meta.userAgent || "",

    ip:
      meta.ip || "",

    expiresAt: new Date(
      Date.now() +
        REFRESH_TOKEN_TTL_MS
    ),
  });

  return {
    accessToken,
    refreshToken,
  };
}

// =====================================================
// EXPORT
// =====================================================

export default {
  register,
  login,
  googleLogin,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};