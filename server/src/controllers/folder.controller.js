import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import folderService from "../services/folder.service.js";
export const createFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.createFolder(req.user._id, req.body);
  new ApiResponse(HTTP_STATUS.CREATED, { folder }, "Folder created successfully").send(res);
});

export const listFolders = asyncHandler(async (req, res) => {
  const folders = await folderService.listFolders(req.user._id);
  new ApiResponse(HTTP_STATUS.OK, { folders }, "Folders fetched successfully").send(res);
});

export const updateFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.updateFolder(req.user._id, req.params.id, req.body);
  new ApiResponse(HTTP_STATUS.OK, { folder }, "Folder updated successfully").send(res);
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const result = await folderService.deleteFolder(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, {}, result.message).send(res);
});

export const moveConversation = asyncHandler(async (req, res) => {
  const conversation = await folderService.moveConversation(
    req.user._id,
    req.params.id,
    req.body.folderId
  );
  new ApiResponse(HTTP_STATUS.OK, { conversation }, "Conversation moved successfully").send(res);
});