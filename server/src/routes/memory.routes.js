import { Router } from "express";
import * as memoryController from "../controllers/memory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createMemorySchema,
  updateMemorySchema,
  memoryIdParamSchema,
} from "../validations/memory.validation.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .post(validate(createMemorySchema), memoryController.createMemory)
  .get(memoryController.getMemories);

router
  .route("/:id")
  .get(validate(memoryIdParamSchema), memoryController.getMemoryById)
  .patch(validate(updateMemorySchema), memoryController.updateMemory)
  .delete(validate(memoryIdParamSchema), memoryController.deleteMemory);

export default router;
