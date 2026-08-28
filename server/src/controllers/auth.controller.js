import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import authService from "../services/auth.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { env } from "../config/env.js";

// =====================================================
// COOKIE OPTIONS
// =====================================================

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
};

// =====================================================
// REQUEST META
// =====================================================

function getMeta(req) {
  return {
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip,
  };
}

// =====================================================
// REGISTER
// =====================================================

export const register = asyncHandler(async (req, res) => {
  const {
    user,
    accessToken,
    refreshToken,
  } = await authService.register(
    req.body,
    getMeta(req)
  );

  res
    .cookie(
      "accessToken",
      accessToken,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      }
    )
    .cookie(
      "refreshToken",
      refreshToken,
      {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

  new ApiResponse(
    HTTP_STATUS.CREATED,
    {
      user,
      accessToken,
      refreshToken,
    },
    "Account created successfully"
  ).send(res);
});

// =====================================================
// LOGIN
// =====================================================

export const login = asyncHandler(async (req, res) => {
  const {
    user,
    accessToken,
    refreshToken,
  } = await authService.login(
    req.body,
    getMeta(req)
  );

  res
    .cookie(
      "accessToken",
      accessToken,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      }
    )
    .cookie(
      "refreshToken",
      refreshToken,
      {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    {
      user,
      accessToken,
      refreshToken,
    },
    "Login successful"
  ).send(res);
});

// =====================================================
// REFRESH TOKEN
// =====================================================

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken;

  const tokens =
    await authService.refreshAccessToken(
      incomingToken
    );

  res
    .cookie(
      "accessToken",
      tokens.accessToken,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      }
    )
    .cookie(
      "refreshToken",
      tokens.refreshToken,
      {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    tokens,
    "Token refreshed successfully"
  ).send(res);
});

// =====================================================
// LOGOUT
// =====================================================

export const logout = asyncHandler(async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken;

  await authService.logout(incomingToken);

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions);

  new ApiResponse(
    HTTP_STATUS.OK,
    {},
    "Logged out successfully"
  ).send(res);
});

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = asyncHandler(
  async (req, res) => {
    const result =
      await authService.forgotPassword(
        req.body.email
      );

    new ApiResponse(
      HTTP_STATUS.OK,
      result,
      result.message
    ).send(res);
  }
);

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = asyncHandler(
  async (req, res) => {
    const result =
      await authService.resetPassword(
        req.body.token,
        req.body.newPassword
      );

    new ApiResponse(
      HTTP_STATUS.OK,
      result,
      result.message
    ).send(res);
  }
);

// =====================================================
// SEND VERIFICATION EMAIL
// =====================================================

export const sendVerificationEmail =
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const result =
      await authService.sendVerificationEmail(
        userId
      );

    new ApiResponse(
      HTTP_STATUS.OK,
      result,
      result.message
    ).send(res);
  });

// =====================================================
// VERIFY EMAIL
// =====================================================

export const verifyEmail =
  asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw ApiError.badRequest(
        "Verification token is required"
      );
    }

    const result =
      await authService.verifyEmail(token);

    new ApiResponse(
      HTTP_STATUS.OK,
      result,
      result.message
    ).send(res);
  });

// =====================================================
// CURRENT USER
// =====================================================

export const getCurrentUser =
  asyncHandler(async (req, res) => {
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user: req.user,
      },
      "Current user fetched"
    ).send(res);
  });