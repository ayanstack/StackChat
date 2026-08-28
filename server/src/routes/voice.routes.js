import { Router } from "express";
import * as voiceController from "../controllers/voice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { textToSpeechSchema } from "../validations/voice.validation.js";

const router = Router();

router.use(verifyJWT);

// Speech to Text (Transcribe Audio)
router.post(
  "/transcribe",
  aiRateLimiter,
  upload.single("audio"),
  voiceController.speechToText
);

// Text to Speech (Generate Audio)
router.post(
  "/synthesize",
  aiRateLimiter,
  validate(textToSpeechSchema),
  voiceController.textToSpeech
);

export default router;
