import { Router } from "express";
import * as fileController from "../controllers/file.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadRateLimiter } from "../middlewares/security.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { fileIdParamSchema } from "../validations/file.validation.js";

const router = Router();

router.use(verifyJWT);

router.post("/", uploadRateLimiter, upload.single("file"), fileController.uploadFile);
router.get("/", fileController.listFiles);
router.get("/:id", validate(fileIdParamSchema), fileController.getFile);
router.delete("/:id", validate(fileIdParamSchema), fileController.deleteFile);

export default router;