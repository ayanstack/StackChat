import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  editMessageSchema,
  messageIdParamSchema,
  searchMessagesSchema,
} from "../validations/message.validation.js";

const router = Router();

router.use(verifyJWT);

router.get("/search", validate(searchMessagesSchema), messageController.searchMessages);

router.patch("/:id", aiRateLimiter, validate(editMessageSchema), messageController.editMessage);
router.delete("/:id", validate(messageIdParamSchema), messageController.deleteMessage);
router.post("/:id/regenerate", aiRateLimiter, validate(messageIdParamSchema), messageController.regenerateResponse);
router.post("/:id/continue", aiRateLimiter, validate(messageIdParamSchema), messageController.continueGeneration);

export default router;