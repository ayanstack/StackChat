import ApiError from "../utils/ApiError.js";
import { CONVERSATION_STATUS } from "../constants/enums.js";
import Conversation from "../models/conversation.model.js";

async function createConversation(
  userId,
  { title, model, systemPrompt }
) {
  const conversation = await Conversation.create({
    user: userId,
    title: title || "New Conversation",
    model: model || "gpt-4o-mini",
    systemPrompt: systemPrompt || "",
  });

  return conversation;
}

async function listConversations(
  userId,
  { page = 1, limit = 20, search, status } = {}
) {
  // Convert query parameters from string to number
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const query = {
    user: userId,
    isDeleted: false,
    status: status || {
      $ne: CONVERSATION_STATUS.DELETED,
    },
  };

  if (search) {
    query.$text = {
      $search: search,
    };
  }

  // Calculate skip BEFORE using it
  const skip = (page - 1) * limit;

  // Run both queries together
  const [conversations, total] = await Promise.all([
    Conversation.find(query)
      .sort({
        isPinned: -1,
        lastMessageAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Conversation.countDocuments(query),
  ]);

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getConversationById(userId, conversationId) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId,
    isDeleted: false,
  });

  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  return conversation;
}

async function renameConversation(userId, conversationId, title) {
  if (!title || !title.trim()) {
    throw ApiError.badRequest("Conversation title is required");
  }

  const conversation = await getConversationById(
    userId,
    conversationId
  );

  conversation.title = title.trim();

  await conversation.save();

  return conversation;
}

async function deleteConversation(userId, conversationId) {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  conversation.status = CONVERSATION_STATUS.DELETED;
  conversation.isDeleted = true;

  await conversation.save();

  return conversation;
}

async function togglePin(userId, conversationId) {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  conversation.isPinned = !conversation.isPinned;

  await conversation.save();

  return conversation;
}

async function toggleFavorite(userId, conversationId) {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  conversation.isFavourite = !conversation.isFavourite;

  await conversation.save();

  return conversation;
}

async function toggleArchive(userId, conversationId) {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  conversation.status =
    conversation.status === CONVERSATION_STATUS.ARCHIVED
      ? CONVERSATION_STATUS.ACTIVE
      : CONVERSATION_STATUS.ARCHIVED;

  await conversation.save();

  return conversation;
}

export default {
  createConversation,
  listConversations,
  getConversationById,
  renameConversation,
  deleteConversation,
  togglePin,
  toggleFavorite,
  toggleArchive,
};