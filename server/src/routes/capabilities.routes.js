import { Router } from "express";
import * as capabilitiesController from "../controllers/capabilities.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Allow authenticated users to query capabilities
router.get("/", verifyJWT, capabilitiesController.getCapabilities);

export default router;
