import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import memoryService from "../services/memory.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const createMemory = asyncHandler(async (req, res) => {
  const memory = await memoryService.createMemory(req.user._id, req.body);
  new ApiResponse(HTTP_STATUS.CREATED, memory, "Memory created successfully").send(res);
});

export const getMemories = asyncHandler(async (req, res) => {
  const memories = await memoryService.getMemories(req.user._id, req.query);
  new ApiResponse(HTTP_STATUS.OK, memories, "Memories fetched successfully").send(res);
});

export const getMemoryById = asyncHandler(async (req, res) => {
  const memory = await memoryService.getMemoryById(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, memory, "Memory fetched successfully").send(res);
});

export const updateMemory = asyncHandler(async (req, res) => {
  const memory = await memoryService.updateMemory(req.user._id, req.params.id, req.body);
  new ApiResponse(HTTP_STATUS.OK, memory, "Memory updated successfully").send(res);
});

export const deleteMemory = asyncHandler(async (req, res) => {
  await memoryService.deleteMemory(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, null, "Memory deleted successfully").send(res);
});

export default {
  createMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
};
