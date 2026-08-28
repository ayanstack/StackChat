import { Router } from "express";
import * as visionController from "../controllers/vision.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadRateLimiter } from "../middlewares/security.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(verifyJWT);

// Vision analysis (file upload or URL/Base64)
router.post(
  "/analyze",
  uploadRateLimiter,
  upload.single("image"),
  visionController.analyzeImage
);

export default router;
