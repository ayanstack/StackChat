import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import fileService from "../services/file.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }

  const attachment = await fileService.uploadFile(
    req.user._id,
    req.file,
    req.body.conversationId || null
  );

  new ApiResponse(HTTP_STATUS.CREATED, { file: attachment }, "File uploaded successfully").send(res);
});

export const getFile = asyncHandler(async (req, res) => {
  const attachment = await fileService.getFileById(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, { file: attachment }, "File fetched successfully").send(res);
});

export const listFiles = asyncHandler(async (req, res) => {
  const files = await fileService.listFiles(req.user._id);
  new ApiResponse(HTTP_STATUS.OK, { files }, "Files fetched successfully").send(res);
});

export const deleteFile = asyncHandler(async (req, res) => {
  await fileService.deleteFile(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, {}, "File deleted successfully").send(res);
});
