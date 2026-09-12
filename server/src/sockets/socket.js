import { Server } from "socket.io";
import mongoose from "mongoose";

import { verifyAccessToken } from "../helpers/tokenHelper.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

import logger from "../logger/logger.js";
import { env } from "../config/env.js";

let io = null;

// =====================================================
// NORMALIZE CONVERSATION ID
// =====================================================

function normalizeConversationId(value) {
  if (value && typeof value === "object") {
    value = value.conversationId;
  }

  if (typeof value !== "string") {
    return null;
  }

  let conversationId = value.trim();

  if (
    conversationId.startsWith('"') &&
    conversationId.endsWith('"')
  ) {
    try {
      conversationId = JSON.parse(conversationId);
    } catch {
      conversationId = conversationId.slice(1, -1);
    }
  }

  return conversationId.trim() || null;
}

// =====================================================
// VALIDATE OBJECT ID
// =====================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================

export function initializeSocket(server) {
  const allowedOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(",").map((o) => o.trim())
    : ["http://localhost:5000"];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (
          /\.vercel\.app$/.test(origin) ||
          /\.onrender\.com$/.test(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  // ===================================================
  // SOCKET AUTHENTICATION
  // ===================================================

  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!rawToken) {
        return next(
          new Error("Authentication token missing")
        );
      }

      const token = rawToken.startsWith("Bearer ")
        ? rawToken.slice(7)
        : rawToken;

      if (!token) {
        return next(
          new Error("Authentication token missing")
        );
      }

      const decoded = verifyAccessToken(token);

      const userId =
        decoded?.userId ||
        decoded?.id ||
        decoded?._id;

      if (!userId) {
        return next(
          new Error("Invalid authentication token")
        );
      }

      const user = await User.findById(userId).select(
        "-password -passwordResetToken -passwordResetExpires"
      );

      if (!user) {
        return next(new Error("User not found"));
      }

      if (user.isDeleted) {
        return next(
          new Error("User account is deactivated")
        );
      }

      socket.userId = user._id.toString();
      socket.user = user;

      logger.info(
        `Socket authentication successful for user: ${socket.userId}`
      );

      next();
    } catch (error) {
      logger.error(
        `Socket authentication error: ${error.message}`
      );

      next(
        new Error(
          error.message || "Invalid or expired token"
        )
      );
    }
  });

  // ===================================================
  // SOCKET CONNECTION
  // ===================================================

  io.on("connection", (socket) => {
    logger.info(
      `Socket connected: ${socket.id} (user: ${socket.userId})`
    );

    // =================================================
    // JOIN CONVERSATION
    // =================================================

    socket.on(
      "join_conversation",
      async (payload, ack) => {
        try {
          const conversationId =
            normalizeConversationId(payload);

          if (!conversationId) {
            const response = {
              success: false,
              message: "conversationId is required",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          if (!isValidObjectId(conversationId)) {
            const response = {
              success: false,
              message: "Invalid conversationId",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          const conversation =
            await Conversation.findOne({
              _id: conversationId,
              user: socket.userId,
            });

          if (!conversation) {
            const response = {
              success: false,
              message:
                "Conversation not found or access denied",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          const roomName =
            `conversation:${conversationId}`;

          await socket.join(roomName);

          const response = {
            success: true,
            conversationId,
            room: roomName,
            message:
              "Successfully joined conversation",
          };

          socket.emit(
            "joined_conversation",
            response
          );

          if (typeof ack === "function") {
            ack(response);
          }

          logger.info(
            `Socket ${socket.id} joined ${roomName}`
          );
        } catch (error) {
          logger.error(
            `join_conversation error: ${error.message}`
          );

          const response = {
            success: false,
            message:
              error.message ||
              "Failed to join conversation",
          };

          socket.emit("generation_error", response);

          if (typeof ack === "function") {
            ack(response);
          }
        }
      }
    );

    // =================================================
    // LEAVE CONVERSATION
    // =================================================

    socket.on(
      "leave_conversation",
      async (payload, ack) => {
        try {
          const conversationId =
            normalizeConversationId(payload);

          if (!conversationId) {
            const response = {
              success: false,
              message: "conversationId is required",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          const roomName =
            `conversation:${conversationId}`;

          await socket.leave(roomName);

          const response = {
            success: true,
            conversationId,
            message:
              "Successfully left conversation",
          };

          socket.emit(
            "left_conversation",
            response
          );

          if (typeof ack === "function") {
            ack(response);
          }

          logger.info(
            `Socket ${socket.id} left ${roomName}`
          );
        } catch (error) {
          logger.error(
            `leave_conversation error: ${error.message}`
          );

          const response = {
            success: false,
            message: "Failed to leave conversation",
          };

          socket.emit("generation_error", response);

          if (typeof ack === "function") {
            ack(response);
          }
        }
      }
    );

    // =================================================
    // TYPING
    // =================================================

    socket.on("typing", (payload) => {
      try {
        const conversationId =
          normalizeConversationId(payload);

        if (!conversationId) return;

        socket
          .to(`conversation:${conversationId}`)
          .emit("user_typing", {
            userId: socket.userId,
            conversationId,
          });
      } catch (error) {
        logger.error(
          `typing socket error: ${error.message}`
        );
      }
    });

    // =================================================
    // STOP TYPING
    // =================================================

    socket.on("stop_typing", (payload) => {
      try {
        const conversationId =
          normalizeConversationId(payload);

        if (!conversationId) return;

        socket
          .to(`conversation:${conversationId}`)
          .emit("user_stopped_typing", {
            userId: socket.userId,
            conversationId,
          });
      } catch (error) {
        logger.error(
          `stop_typing socket error: ${error.message}`
        );
      }
    });

    // =================================================
    // READ / SEEN
    // =================================================

    socket.on("read_conversation", (payload) => {
      try {
        const conversationId = normalizeConversationId(payload);
        if (!conversationId) return;

        socket
          .to(`conversation:${conversationId}`)
          .emit("user_read_conversation", {
            userId: socket.userId,
            conversationId,
            readAt: new Date(),
          });
      } catch (error) {
        logger.error(`read_conversation socket error: ${error.message}`);
      }
    });

    // =================================================
    // SEND MESSAGE
    // =================================================

    socket.on(
      "send_message",
      async (payload, ack) => {
        try {
          logger.info(
            `send_message received from ${socket.userId}`
          );

          logger.info(
            `send_message payload: ${JSON.stringify(payload)}`
          );

          // -------------------------------------------
          // VALIDATE PAYLOAD
          // -------------------------------------------

          if (
            !payload ||
            typeof payload !== "object"
          ) {
            const response = {
              success: false,
              message:
                "Message payload is required",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          // -------------------------------------------
          // GET VALUES
          // -------------------------------------------

          const conversationId =
            normalizeConversationId(
              payload.conversationId
            );

          const content =
            typeof payload.content === "string"
              ? payload.content.trim()
              : "";

          const attachmentIds =
            Array.isArray(payload.attachmentIds)
              ? payload.attachmentIds
              : [];

          // -------------------------------------------
          // VALIDATE CONVERSATION ID
          // -------------------------------------------

          if (!conversationId) {
            const response = {
              success: false,
              message:
                "conversationId is required",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          // -------------------------------------------
          // VALIDATE CONTENT
          // -------------------------------------------

          if (!content) {
            const response = {
              success: false,
              message: "content is required",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          // -------------------------------------------
          // VALIDATE OBJECT ID
          // -------------------------------------------

          if (!isValidObjectId(conversationId)) {
            const response = {
              success: false,
              message: "Invalid conversationId",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          // -------------------------------------------
          // CHECK CONVERSATION OWNERSHIP
          // -------------------------------------------

          const conversation =
            await Conversation.findOne({
              _id: conversationId,
              user: socket.userId,
            });

          if (!conversation) {
            const response = {
              success: false,
              message:
                "Conversation not found or access denied",
            };

            socket.emit("generation_error", response);

            if (typeof ack === "function") {
              ack(response);
            }

            return;
          }

          logger.info(
            `Conversation validated: ${conversationId}`
          );

          // -------------------------------------------
          // LOAD MESSAGE SERVICE
          // -------------------------------------------

          logger.info(
            "Loading message.service.js..."
          );

          const {
            default: messageService,
          } = await import(
            "../services/message.service.js"
          );

          logger.info(
            "message.service.js loaded successfully"
          );

          // -------------------------------------------
          // CHECK SERVICE FUNCTION
          // -------------------------------------------

          if (
            !messageService ||
            typeof messageService.sendMessageStream !==
              "function"
          ) {
            throw new Error(
              "messageService.sendMessageStream is not a function"
            );
          }

          logger.info(
            "Calling sendMessageStream..."
          );

          // -------------------------------------------
          // SEND MESSAGE
          // -------------------------------------------

          const model =
            typeof payload.model === "string"
              ? payload.model
              : null;

          const webSearch = Boolean(payload.webSearch);

          await messageService.sendMessageStream(
            socket.userId,
            conversationId,
            content,
            attachmentIds,
            model,
            { webSearch }
          );

          // -------------------------------------------
          // ACK SUCCESS
          // -------------------------------------------

          const successResponse = {
            success: true,
            conversationId,
            message:
              "Message processing started",
          };

          if (typeof ack === "function") {
            ack(successResponse);
          }

          logger.info(
            `sendMessageStream completed for conversation ${conversationId}`
          );
        } catch (error) {
          logger.error(
            `send_message socket error: ${error.message}`
          );

          logger.error(error.stack);

          const errorResponse = {
            success: false,
            message:
              error.message ||
              "Failed to send message",
          };

          socket.emit(
            "generation_error",
            errorResponse
          );

          if (typeof ack === "function") {
            ack(errorResponse);
          }
        }
      }
    );

    // =================================================
    // DISCONNECT
    // =================================================

    socket.on("disconnect", (reason) => {
      logger.info(
        `Socket disconnected: ${socket.id} (user: ${socket.userId}) reason: ${reason}`
      );
    });
  });

  logger.info(
    "Socket.IO initialized successfully"
  );

  return io;
}

// =====================================================
// GET SOCKET.IO INSTANCE
// =====================================================

export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initializeSocket(server) first."
    );
  }

  return io;
}