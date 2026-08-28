import { Router } from "express";
import * as aiUtilsController from "../controllers/aiUtils.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  textInputSchema,
  translateSchema,
  explainCodeSchema,
  customPromptSchema,
} from "../validations/aiUtils.validation.js";

const router = Router();

router.use(verifyJWT);

router.post("/explain-code", validate(explainCodeSchema), aiUtilsController.explainCode);
router.post("/summarize", validate(textInputSchema), aiUtilsController.summarizeText);
router.post("/translate", validate(translateSchema), aiUtilsController.translateText);
router.post("/rewrite", validate(textInputSchema), aiUtilsController.rewriteText);
router.post("/fix-grammar", validate(textInputSchema), aiUtilsController.fixGrammar);
router.post("/custom-prompt", validate(customPromptSchema), aiUtilsController.customPrompt);

export default router;