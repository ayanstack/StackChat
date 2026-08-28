import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import messageRoutes from "./message.routes.js";
import {
  createConversationSchema,
  conversationIdParamSchema,
  renameConversationSchema,
  listConversationsSchema,
} from "../validations/conversation.validation.js";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createConversationSchema), conversationController.createConversation);
router.get("/", validate(listConversationsSchema), conversationController.listConversations);
router.get("/:id", validate(conversationIdParamSchema), conversationController.getConversation);
router.patch(
  "/:id/rename",
  validate(renameConversationSchema),
  conversationController.renameConversation
);
router.delete("/:id", validate(conversationIdParamSchema), conversationController.deleteConversation);
router.patch("/:id/pin", validate(conversationIdParamSchema), conversationController.togglePin);
router.patch(
  "/:id/favorite",
  validate(conversationIdParamSchema),
  conversationController.toggleFavorite
);
router.patch(
  "/:id/archive",
  validate(conversationIdParamSchema),
  conversationController.toggleArchive
);

router.use("/:conversationId/messages", messageRoutes);

export default router;