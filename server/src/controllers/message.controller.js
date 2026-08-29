import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import messageService from "../services/message.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { userMessage, assistantMessage } = await messageService.sendMessage(
    req.user._id,
    req.params.conversationId,
    req.body.content,
    req.body.attachmentIds,
    req.body.model
  );
  new ApiResponse(
    HTTP_STATUS.CREATED,
    { userMessage, assistantMessage },
    "Message sent and AI response generated"
  ).send(res);
});

export const regenerateResponse = asyncHandler(async (req, res) => {
  const assistantMessage = await messageService.regenerateResponse(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, { assistantMessage }, "Response regenerated successfully").send(res);
});

export const continueGeneration = asyncHandler(async (req, res) => {
  const message = await messageService.continueGeneration(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, { message }, "Response continued successfully").send(res);
});

export const listMessages = asyncHandler(async (req, res) => {
  const result = await messageService.listMessages(req.user._id, req.params.conversationId, req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "Messages fetched successfully").send(res);
});

export const searchMessages = asyncHandler(async (req, res) => {
  const result = await messageService.searchMessages(req.user._id, req.query.q, req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "Search completed successfully").send(res);
});

export const editMessage = asyncHandler(async (req, res) => {
  const message = await messageService.editMessage(req.user._id, req.params.id, req.body.content);
  new ApiResponse(HTTP_STATUS.OK, { message }, "Message updated successfully").send(res);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await messageService.deleteMessage(req.user._id, req.params.id);
  new ApiResponse(HTTP_STATUS.OK, {}, "Message deleted successfully").send(res);
});