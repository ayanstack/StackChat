import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Attachment from "../models/attachment.model.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGE_ROLES, MESSAGE_STATUS } from "../constants/enums.js";
import aiService from "./ai.service.js";
import getAIProvider from "../ai/aiProvider.factory.js";
import { env } from "../config/env.js";
import logger from "../logger/logger.js";

import { getIO } from "../sockets/socket.js";

async function assertConversationOwnership(userId, conversationId) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  return conversation;
}

async function validateAttachments(userId, attachmentIds) {
  if (!attachmentIds || attachmentIds.length === 0) {
    return [];
  }

  const attachments = await Attachment.find({
    _id: { $in: attachmentIds },
    user: userId,
  });

  if (attachments.length !== attachmentIds.length) {
    throw ApiError.badRequest(
      "One or more attachments not found or don't belong to you"
    );
  }

  return attachments;
}

async function createAssistantReply(conversation, currentMessage = null) {
  try {
    const aiResult = await aiService.generateAIResponse(
      conversation,
      currentMessage
    );

    const assistantMessage = await Message.create({
      conversation: conversation._id,
      user: conversation.user,
      role: MESSAGE_ROLES.ASSISTANT,
      content: aiResult.content,
      status: MESSAGE_STATUS.COMPLETED,
      metadata: aiResult.metadata || {},
    });

    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    return assistantMessage;
  } catch (error) {
    logger.error(`AI generation failed: ${error.message}`);

    return Message.create({
      conversation: conversation._id,
      user: conversation.user,
      role: MESSAGE_ROLES.ASSISTANT,
      content:
        "Sorry, I couldn't generate a response right now. Please try again.",
      status: MESSAGE_STATUS.FAILED,
      metadata: {},
    });
  }
}

async function sendMessage(
  userId,
  conversationId,
  content,
  attachmentIds = [],
  model = null
) {
  const conversation = await assertConversationOwnership(
    userId,
    conversationId
  );

  if (model) {
    conversation.model = model;
  }

  const attachments = await validateAttachments(userId, attachmentIds);

  const userMessage = await Message.create({
    conversation: conversationId,
    user: userId,
    role: MESSAGE_ROLES.USER,
    content,
    attachments: attachments.map((a) => a._id),
    status: MESSAGE_STATUS.COMPLETED,
  });

  conversation.messageCount += 1;
  conversation.lastMessageAt = new Date();

  await conversation.save();

  const assistantMessage = await createAssistantReply(
    conversation,
    userMessage
  );

  return {
    userMessage,
    assistantMessage,
  };
}

async function sendMessageStream(
  userId,
  conversationId,
  content,
  attachmentIds = [],
  model = null
) {
  const io = getIO();
  const room = `conversation:${conversationId}`;

  const conversation = await assertConversationOwnership(userId, conversationId);
  if (model) {
    conversation.model = model;
  }
  const attachments = await validateAttachments(userId, attachmentIds);

  const userMessage = await Message.create({
    conversation: conversationId,
    user: userId,
    role: MESSAGE_ROLES.USER,
    content,
    attachments: attachments.map((a) => a._id),
    status: MESSAGE_STATUS.COMPLETED,
  });

  conversation.messageCount += 1;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  io.to(room).emit("user_message_saved", { userMessage });

  let assistantContent = "";
  let aiMetadata = {};

  try {
    const startTime = Date.now();
    const result = await aiService.generateAIResponseStream(
      conversation,
      userMessage,
      (chunk) => {
        assistantContent += chunk;
        io.to(room).emit("message_chunk", { chunk });
      }
    );
    aiMetadata = result?.metadata || {};
    aiMetadata.latencyMs = Date.now() - startTime;
  } catch (error) {
    logger.error(`AI generation stream failed: ${error.message}`);
    assistantContent = "Sorry, I couldn't generate a response right now.";
  }

  const assistantMessage = await Message.create({
    conversation: conversationId,
    user: userId,
    role: MESSAGE_ROLES.ASSISTANT,
    content: assistantContent,
    status: MESSAGE_STATUS.COMPLETED,
    metadata: aiMetadata,
  });

  io.to(room).emit("message_complete", { assistantMessage });

  return { userMessage, assistantMessage };
}

async function regenerateResponse(userId, messageId) {
  const oldMessage = await Message.findOne({
    _id: messageId,
    user: userId,
    isDeleted: false,
  });

  if (!oldMessage) {
    throw ApiError.notFound("Message not found");
  }

  if (oldMessage.role !== MESSAGE_ROLES.ASSISTANT) {
    throw ApiError.badRequest(
      "Only AI responses can be regenerated"
    );
  }

  const conversation = await assertConversationOwnership(
    userId,
    oldMessage.conversation
  );

  oldMessage.isDeleted = true;
  await oldMessage.save();

  const newAssistantMessage = await createAssistantReply(
    conversation
  );

  newAssistantMessage.parentMessage = oldMessage._id;
  await newAssistantMessage.save();

  return newAssistantMessage;
}

async function continueGeneration(userId, messageId) {
  const message = await Message.findOne({
    _id: messageId,
    user: userId,
    isDeleted: false,
  });

  if (!message) {
    throw ApiError.notFound("Message not found");
  }

  // IMPORTANT:
  // Continue only works with an assistant/AI message.
  if (message.role !== MESSAGE_ROLES.ASSISTANT) {
    throw ApiError.badRequest(
      "Only AI responses can be continued"
    );
  }

  const conversation = await assertConversationOwnership(
    userId,
    message.conversation
  );

  try {
    const provider = getAIProvider(env.AI_PROVIDER);

    const recentMessages = await Message.find({
      conversation: conversation._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const orderedMessages = recentMessages
      .reverse()
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Tell AI to continue the existing response.
    orderedMessages.push({
      role: MESSAGE_ROLES.USER,
      content: `Continue exactly where your previous response left off.

Do not repeat anything you already said.
Do not add any preamble such as "Sure, continuing:".
Only output the next part of the response directly.

Previous response:
"${message.content}"`,
    });

    const aiResult = await provider.generateReply({
      messages: orderedMessages,
      systemPrompt: conversation.systemPrompt,
      model: "gemini-3.6-flash",
    });

    if (!aiResult || !aiResult.content) {
      throw new Error("AI provider returned an empty response");
    }

    // Make sure metadata always exists.
    if (!message.metadata) {
      message.metadata = {};
    }

    message.content += aiResult.content;

    message.metadata.totalTokens =
      (message.metadata.totalTokens || 0) +
      (aiResult.metadata?.totalTokens || 0);

    message.status = MESSAGE_STATUS.COMPLETED;

    await message.save();

    return message;
  } catch (error) {
    logger.error(
      `Continue generation failed: ${error.message}`
    );

    throw ApiError.internal(
      "Failed to continue the response, please try again"
    );
  }
}

async function listMessages(
  userId,
  conversationId,
  { page, limit }
) {
  await assertConversationOwnership(userId, conversationId);

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "attachments",
        "originalName fileType url"
      )
      .lean(),

    Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function searchMessages(
  userId,
  searchTerm,
  { page, limit }
) {
  const skip = (page - 1) * limit;

  const userConversations = await Conversation.find({
    user: userId,
  })
    .select("_id")
    .lean();

  const conversationIds = userConversations.map(
    (c) => c._id
  );

  const query = {
    conversation: { $in: conversationIds },
    isDeleted: false,
    $text: { $search: searchTerm },
  };

  const [messages, total] = await Promise.all([
    Message.find(query, {
      score: { $meta: "textScore" },
    })
      .sort({
        score: { $meta: "textScore" },
      })
      .skip(skip)
      .limit(limit)
      .populate("conversation", "title")
      .lean(),

    Message.countDocuments(query),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function editMessage(
  userId,
  messageId,
  newContent
) {
  const message = await Message.findOne({
    _id: messageId,
    user: userId,
    isDeleted: false,
  });

  if (!message) {
    throw ApiError.notFound("Message not found");
  }

  message.content = newContent;
  message.isEdited = true;

  await message.save();

  return message;
}

async function deleteMessage(userId, messageId) {
  const message = await Message.findOne({
    _id: messageId,
    user: userId,
    isDeleted: false,
  });

  if (!message) {
    throw ApiError.notFound("Message not found");
  }

  message.isDeleted = true;

  await message.save();

  return message;
}

export default {
  sendMessage,
  sendMessageStream,
  regenerateResponse,
  continueGeneration,
  listMessages,
  searchMessages,
  editMessage,
  deleteMessage,
};