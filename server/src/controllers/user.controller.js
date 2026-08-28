import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import userService from "../services/user.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getProfile = asyncHandler(async (req, res) => {
  new ApiResponse(HTTP_STATUS.OK, { user: req.user }, "Profile fetched successfully").send(res);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  new ApiResponse(HTTP_STATUS.OK, { user }, "Profile updated successfully").send(res);
});

export const updatePassword = asyncHandler(async (req, res) => {
  const result = await userService.updatePassword(
    req.user._id,
    req.body.currentPassword,
    req.body.newPassword
  );
  new ApiResponse(HTTP_STATUS.OK, result, result.message).send(res);
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image was uploaded");
  const user = await userService.uploadAvatar(req.user._id, req.file);
  new ApiResponse(HTTP_STATUS.OK, { user }, "Avatar updated successfully").send(res);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const user = await userService.updateSettings(req.user._id, req.body);
  new ApiResponse(HTTP_STATUS.OK, { user }, "Settings updated successfully").send(res);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(req.user._id);
  new ApiResponse(HTTP_STATUS.OK, result, result.message).send(res);
});