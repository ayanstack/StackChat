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
import { validateOriginalEmail } from "../utils/emailValidator.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// =====================================================
// REGISTER
// =====================================================

async function register({ name, email, password }, meta = {}) {
  const normalizedEmail = await validateOriginalEmail(email);

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

  // Send welcome & account registration alert email
  try {
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">🎉 Welcome to StackChat!</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Account Created Successfully</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${name || "there"}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Your StackChat account has been registered with <strong>${normalizedEmail}</strong>.</p>
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 4px 0; font-size: 14px; color: #1e40af;"><strong>Time:</strong> ${timeString}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #1e40af;"><strong>IP Address:</strong> ${meta.ip || "Unknown"}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #1e40af;"><strong>Device / Browser:</strong> ${meta.userAgent || "Unknown"}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">You can now access AI chat, vision analysis, places discovery, research tools, and more.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
      </div>
    `;

    sendEmail(
      normalizedEmail,
      "Welcome to StackChat — Account Created Successfully",
      welcomeHtml
    ).catch((err) => logger.error(`Failed to send welcome email: ${err.message}`));
  } catch (err) {
    logger.error(`Error sending welcome notification: ${err.message}`);
  }

  return {
    user: user.toSafeObject(),
    ...tokens,
  };
}

// =====================================================
// LOGIN
// =====================================================

async function login({ email, password }, meta = {}) {
  const normalizedEmail = await validateOriginalEmail(email);

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

      sendEmail(
        normalizedEmail,
        "Security Alert: Login Attempt - StackChat",
        emailHtml
      ).catch((mailErr) => logger.warn(`[Login Alert] Failed to send email: ${mailErr.message}`));
    } catch (mailErr) {
      logger.error(`Failed to initiate security alert email for unregistered user: ${mailErr.message}`);
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
    // 1. Create in-app notification for the user (non-blocking)
    try {
      notificationService.createNotification(user._id, {
        title: "Security Alert: Failed Login Attempt",
        message: `An unsuccessful login attempt was detected on your account from IP ${meta.ip || "unknown"}.`,
        type: "warning",
      }).catch((notifErr) => logger.warn(`[Notification] Failed: ${notifErr.message}`));
    } catch (notifErr) {
      logger.error(`Failed to create in-app notification on failed login: ${notifErr.message}`);
    }

    // 2. Send security alert email to user's Gmail (non-blocking so response is returned immediately)
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

      sendEmail(
        user.email,
        "Security Alert: Failed Login Attempt - StackChat",
        emailHtml
      ).catch((mailErr) => logger.warn(`[Alert Email] ${mailErr.message}`));
    } catch (mailErr) {
      logger.error(`Failed to send security alert email: ${mailErr.message}`);
    }

    throw ApiError.unauthorized(
      "Invalid email or password"
    );
  }

  const tokens = await issueTokens(user, meta);

  // Send successful login security alert email to user's real email
  try {
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">🔐 Security Alert: Successful Sign-in</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">StackChat Account Protection</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name || "User"}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">We detected a successful sign-in to your StackChat account.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Time:</strong> ${timeString}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>IP Address:</strong> ${meta.ip || "Unknown"}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Device / Browser:</strong> ${meta.userAgent || "Unknown"}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">If this was you, no action is needed. If you did not sign in, please reset your password immediately to secure your account.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
      </div>
    `;

    sendEmail(
      user.email,
      "Security Alert: New Sign-in to StackChat",
      emailHtml
    ).catch((err) => logger.error(`Failed to send login alert: ${err.message}`));
  } catch (alertErr) {
    logger.error(`Error initiating login alert email: ${alertErr.message}`);
  }

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

  const normalizedEmail = await validateOriginalEmail(email);

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

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }

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

  // Send Google sign-in security alert email
  try {
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">🔐 Security Alert: Google Sign-in</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">StackChat Account Protection</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name || "User"}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">We detected a sign-in to your StackChat account via Google OAuth.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Time:</strong> ${timeString}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>IP Address:</strong> ${meta.ip || "Unknown"}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
      </div>
    `;

    sendEmail(
      user.email,
      "Security Alert: Google Sign-in - StackChat",
      emailHtml
    ).catch((err) => logger.error(`Failed to send Google login alert: ${err.message}`));
  } catch (err) {
    logger.error(`Error sending Google login alert notification: ${err.message}`);
  }

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
    throw ApiError.badRequest("Email is required");
  }

  const normalizedEmail = await validateOriginalEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: false,
  });

  if (!user) {
    return {
      message: "If that email exists, a reset code and link have been sent to your email.",
    };
  }

  // Method 1: Generate 32-byte secure token for direct URL
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Method 2: Generate 6-digit OTP code for instant manual entry
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetOtp = hashedOtp;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await user.save({ validateBeforeSave: false });

  const clientBase = env.CLIENT_URL || "http://localhost:5000";
  const resetUrl = `${clientBase}/?resetToken=${rawToken}`;
  const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your StackChat Password</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #3730a3;">
      <div style="display: inline-block; background-color: #4f46e5; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; margin-bottom: 12px; font-size: 24px; text-align: center;">
        🔐
      </div>
      <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Password Reset Request</h1>
      <p style="color: #c7d2fe; margin: 0; font-size: 14px;">StackChat Account Protection</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <p style="color: #f3f4f6; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>${user.name || "User"}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        We received a request to reset the password for your StackChat account (<strong>${normalizedEmail}</strong>). Choose either method below to reset your password:
      </p>

      <!-- Method 1: 6-Digit Code -->
      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="display: block; color: #a5b4fc; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Method 1: Enter this 6-Digit Reset Code
        </span>
        <div style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 8px 0;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 6px 0 0 0;">Valid for 15 minutes • Single use only</p>
      </div>

      <!-- Method 2: Direct Reset Link -->
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="display: block; color: #a5b4fc; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
          Method 2: Or Click Below to Reset Instantly
        </span>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
          Reset Password
        </a>
      </div>

      <!-- Warning Box -->
      <div style="background-color: #2e1065; border-left: 4px solid #a855f7; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
        <p style="color: #e9d5ff; font-size: 13px; line-height: 1.5; margin: 0;">
          <strong>⚠️ Did not request this?</strong> If you did not make this request, someone else may have typed your email. You can safely ignore this email; your account remains secure.
        </p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
        Requested on: ${timeString}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; padding: 18px 24px; text-align: center; border-top: 1px solid #1e293b;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        © StackChat AI Workspace. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `;

  const emailSent = await sendEmail(
    user.email,
    `🔐 ${otpCode} is your StackChat password reset code`,
    html
  );

  if (!emailSent) {
    logger.warn(`🔐 Password reset for ${normalizedEmail} (Email delivery failed/unconfigured). OTP: ${otpCode} | Token: ${rawToken}`);
    return {
      message: "Password reset request processed. If your email server is configured, check your inbox. (Dev Code: " + otpCode + ")",
      devOtp: otpCode,
      resetToken: rawToken,
    };
  }

  return {
    message: "A 6-digit reset code and link have been sent to your email.",
  };
}

// =====================================================
// RESET PASSWORD
// =====================================================

async function resetPassword(tokenOrOtp, newPassword) {
  if (!tokenOrOtp) {
    throw ApiError.badRequest("Reset code or token is required");
  }

  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest("New password must be at least 8 characters");
  }

  const cleanInput = tokenOrOtp.toString().trim();
  const hashedInput = crypto
    .createHash("sha256")
    .update(cleanInput)
    .digest("hex");

  const user = await User.findOne({
    $or: [
      { passwordResetToken: hashedInput },
      { passwordResetOtp: hashedInput },
    ],
    passwordResetExpires: { $gt: new Date() },
    isDeleted: false,
  }).select("+passwordResetToken +passwordResetOtp +passwordResetExpires");

  if (!user) {
    throw ApiError.badRequest(
      "Reset code or link is invalid or has expired. Please request a new one."
    );
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all existing refresh tokens
  await RefreshToken.updateMany(
    { user: user._id },
    { isRevoked: true }
  );

  // Send confirmation alert email
  try {
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const successHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin-bottom: 8px;">✅ Password Changed Successfully</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">StackChat Account Security</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name || "User"}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Your StackChat password was successfully reset on <strong>${timeString}</strong>.</p>
        <p style="color: #dc2626; font-size: 14px; line-height: 1.5; font-weight: bold;">If you did not perform this change, please contact support or reset your password immediately.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">— StackChat Security Team</p>
      </div>
    `;

    sendEmail(
      user.email,
      "Security Alert: Password Changed Successfully - StackChat",
      successHtml
    ).catch((err) => logger.error(`Failed to send password change confirmation: ${err.message}`));
  } catch (err) {
    logger.error(`Error sending password change confirmation: ${err.message}`);
  }

  return {
    message: "Password has been reset successfully. You can now sign in with your new password.",
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