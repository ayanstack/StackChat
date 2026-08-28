import { Router } from "express";
import * as imageGenerationController from "../controllers/imageGeneration.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { generateImageSchema } from "../validations/imageGeneration.validation.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/generate",
  aiRateLimiter,
  validate(generateImageSchema),
  imageGenerationController.generateImage
);

export default router;
