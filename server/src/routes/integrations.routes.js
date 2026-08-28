import { Router } from "express";
import * as integrationsController from "../controllers/integrations.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  connectIntegrationSchema,
  integrationProviderParamSchema,
} from "../validations/integrations.validation.js";

const router = Router();

router.use(verifyJWT);

router.get("/", integrationsController.getIntegrations);
router.post("/connect", validate(connectIntegrationSchema), integrationsController.connect);
router.post("/disconnect/:provider", validate(integrationProviderParamSchema), integrationsController.disconnect);

export default router;
