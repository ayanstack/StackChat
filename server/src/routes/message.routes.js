import { Router } from "express";

import * as messageController from "../controllers/message.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  sendMessageSchema,
  listMessagesSchema,
} from "../validations/message.validation.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

// Send message
router.post(
  "/",
  aiRateLimiter,
  validate(sendMessageSchema),
  messageController.sendMessage
);

// List messages
router.get(
  "/",
  validate(listMessagesSchema),
  messageController.listMessages
);

// Regenerate AI response
router.post(
  "/:id/regenerate",
  aiRateLimiter,
  messageController.regenerateResponse
);

// Edit message
router.patch(
  "/:id",
  messageController.editMessage
);

// Delete message
router.delete(
  "/:id",
  messageController.deleteMessage
);

export default router;