import { Router } from "express";
import * as webSearchController from "../controllers/webSearch.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiRateLimiter } from "../middlewares/security.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { webSearchQuerySchema } from "../validations/webSearch.validation.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/query",
  aiRateLimiter,
  validate(webSearchQuerySchema),
  webSearchController.search
);

export default router;
