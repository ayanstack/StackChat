import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import adminService from "../services/admin.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  new ApiResponse(HTTP_STATUS.OK, stats, "Dashboard stats fetched successfully").send(res);
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "Users fetched successfully").send(res);
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getUserDetail(req.params.id);
  new ApiResponse(HTTP_STATUS.OK, result, "User detail fetched successfully").send(res);
});

export const banUser = asyncHandler(async (req, res) => {
  const result = await adminService.banUser(req.params.id);
  new ApiResponse(HTTP_STATUS.OK, result, result.message).send(res);
});

export const unbanUser = asyncHandler(async (req, res) => {
  const result = await adminService.unbanUser(req.params.id);
  new ApiResponse(HTTP_STATUS.OK, result, result.message).send(res);
});

export const listAllConversations = asyncHandler(async (req, res) => {
  const result = await adminService.listAllConversations(req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "All conversations fetched successfully").send(res);
});

export const listAllFiles = asyncHandler(async (req, res) => {
  const result = await adminService.listAllFiles(req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "All files fetched successfully").send(res);
});