import getAIProvider from "../ai/aiProvider.factory.js";
import Message from "../models/message.model.js";
import Attachment from "../models/attachment.model.js";
import { env } from "../config/env.js";
import { FILE_TYPES } from "../constants/enums.js";
import memoryService from "./memory.service.js";

// ============================================================
// GEMINI MODEL
// ============================================================

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

// ============================================================
// BUILD AI CONTEXT
// ============================================================

async function buildContext(conversation, currentMessage = null) {
  const recentMessages = await Message.find({
    conversation: conversation._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const orderedMessages = recentMessages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const images = [];

  // ==========================================================
  // ATTACHMENTS
  // ==========================================================

  if (currentMessage?.attachments?.length > 0) {
    const attachments = await Attachment.find({
      _id: { $in: currentMessage.attachments },
    }).lean();

    let lastMessage = orderedMessages[orderedMessages.length - 1];

    if (!lastMessage) {
      lastMessage = {
        role: "user",
        content: currentMessage.content || "",
      };

      orderedMessages.push(lastMessage);
    }

    for (const attachment of attachments) {
      // IMAGE
      if (attachment.fileType === FILE_TYPES.IMAGE) {
        images.push({
          url: attachment.url,
          mimeType: attachment.mimeType,
        });
        continue;
      }

      // FILE WITH EXTRACTED TEXT
      if (attachment.extractedText) {
        lastMessage.content +=
          `\n\n[Attached file: ${attachment.originalName}]\n` +
          attachment.extractedText;
        continue;
      }

      // FILE STILL PROCESSING
      lastMessage.content +=
        `\n\n[Attached file: ${attachment.originalName} - ` +
        `content still processing]`;
    }
  }

  return {
    orderedMessages,
    images,
  };
}

// ============================================================
// GET AI PROVIDER
// ============================================================

function getProvider() {
  const provider = getAIProvider(env.AI_PROVIDER);

  if (!provider) {
    throw new Error(`AI provider not found: ${env.AI_PROVIDER}`);
  }

  return provider;
}

// ============================================================
// BUILD COMBINED SYSTEM PROMPT (WITH PERSISTENT MEMORIES)
// ============================================================

async function buildSystemPrompt(conversation) {
  let prompt = conversation.systemPrompt || "";
  if (conversation.user) {
    const memoryContext = await memoryService.getActiveMemoriesContext(conversation.user);
    if (memoryContext) {
      prompt = prompt ? `${prompt}\n${memoryContext}` : memoryContext.trim();
    }
  }

  const imageInstruction =
    "IMAGE GENERATION CAPABILITY: When the user asks to generate, create, draw, paint, or render an image or photo, craft a high-detail visual prompt and output it as a markdown image using: ![Description](https://image.pollinations.ai/prompt/{url_encoded_prompt}?nologo=true&model=flux). Always provide the markdown image directly in your response.";

  prompt = prompt ? `${prompt}\n\n${imageInstruction}` : imageInstruction;
  return prompt;
}

// ============================================================
// NON-STREAMING AI RESPONSE
// ============================================================

async function generateAIResponse(conversation, currentMessage = null, options = {}) {
  const provider = getProvider();

  const { orderedMessages, images } = await buildContext(
    conversation,
    currentMessage
  );

  if (typeof provider.generateReply !== "function") {
    throw new Error("AI provider does not support generateReply");
  }

  const systemPrompt = await buildSystemPrompt(conversation);

  return provider.generateReply({
    messages: orderedMessages,
    systemPrompt,
    model: conversation.model || DEFAULT_GEMINI_MODEL,
    images,
    webSearch: Boolean(options.webSearch),
  });
}

// ============================================================
// STREAMING AI RESPONSE
// ============================================================

async function generateAIResponseStream(
  conversation,
  currentMessage = null,
  onChunk,
  options = {}
) {
  const provider = getProvider();

  const { orderedMessages, images } = await buildContext(
    conversation,
    currentMessage
  );

  if (typeof provider.generateReplyStream !== "function") {
    throw new Error("AI provider does not support generateReplyStream");
  }

  if (typeof onChunk !== "function") {
    throw new Error("onChunk callback is required for streaming");
  }

  const systemPrompt = await buildSystemPrompt(conversation);

  return provider.generateReplyStream({
    messages: orderedMessages,
    systemPrompt,
    model: conversation.model || DEFAULT_GEMINI_MODEL,
    images,
    webSearch: Boolean(options.webSearch),
    onChunk,
  });
}

// ============================================================
// EXPORT
// ============================================================

export { generateAIResponse, generateAIResponseStream };

export default {
  generateAIResponse,
  generateAIResponseStream,
};
