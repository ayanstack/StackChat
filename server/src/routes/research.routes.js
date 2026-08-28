import { Router } from "express";
import * as researchController from "../controllers/research.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { researchTopicSchema } from "../validations/research.validation.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/run",
  aiRateLimiter,
  validate(researchTopicSchema),
  researchController.research
);

export default router;
