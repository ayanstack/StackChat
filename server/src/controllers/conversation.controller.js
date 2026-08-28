import { HTTP_STATUS } from "../constants/httpStatus.js";

import conversationService from "../services/conversation.service.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// --------------------
// Create Conversation
// --------------------
export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.createConversation(
    req.user._id,
    req.body
  );

  new ApiResponse(
    HTTP_STATUS.CREATED,
    { conversation },
    "Conversation created successfully"
  ).send(res);
});

// --------------------
// List Conversations
// --------------------
export const listConversations = asyncHandler(async (req, res) => {
  const result = await conversationService.listConversations(
    req.user._id,
    req.query
  );

  new ApiResponse(
    HTTP_STATUS.OK,
    result,
    "Conversations fetched successfully"
  ).send(res);
});

// --------------------
// Get Conversation
// --------------------
export const getConversation = asyncHandler(async (req, res) => {
  const conversation =
    await conversationService.getConversationById(
      req.user._id,
      req.params.id
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    { conversation },
    "Conversation fetched successfully"
  ).send(res);
});

// --------------------
// Rename Conversation
// --------------------
export const renameConversation = asyncHandler(async (req, res) => {
  const conversation =
    await conversationService.renameConversation(
      req.user._id,
      req.params.id,
      req.body.title
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    { conversation },
    "Conversation renamed successfully"
  ).send(res);
});

// --------------------
// Delete Conversation
// --------------------
export const deleteConversation = asyncHandler(async (req, res) => {
  await conversationService.deleteConversation(
    req.user._id,
    req.params.id
  );

  new ApiResponse(
    HTTP_STATUS.OK,
    {},
    "Conversation deleted successfully"
  ).send(res);
});

// --------------------
// Toggle Pin
// --------------------
export const togglePin = asyncHandler(async (req, res) => {
  const conversation =
    await conversationService.togglePin(
      req.user._id,
      req.params.id
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    { conversation },
    "Conversation pin toggled"
  ).send(res);
});

// --------------------
// Toggle Favorite
// --------------------
export const toggleFavorite = asyncHandler(async (req, res) => {
  const conversation =
    await conversationService.toggleFavorite(
      req.user._id,
      req.params.id
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    { conversation },
    "Conversation favorite toggled"
  ).send(res);
});

// --------------------
// Toggle Archive
// --------------------
export const toggleArchive = asyncHandler(async (req, res) => {
  const conversation =
    await conversationService.toggleArchive(
      req.user._id,
      req.params.id
    );

  new ApiResponse(
    HTTP_STATUS.OK,
    { conversation },
    "Conversation archive toggled"
  ).send(res);
});