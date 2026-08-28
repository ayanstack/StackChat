import { Router } from "express";
import * as folderController from "../controllers/folder.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createFolderSchema,
  folderIdParamSchema,
  updateFolderSchema,
  moveConversationSchema,
} from "../validations/folder.validation.js";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createFolderSchema), folderController.createFolder);
router.get("/", folderController.listFolders);
router.patch("/:id", validate(updateFolderSchema), folderController.updateFolder);
router.delete("/:id", validate(folderIdParamSchema), folderController.deleteFolder);

router.patch(
  "/conversations/:id/move",
  validate(moveConversationSchema),
  folderController.moveConversation
);

export default router;