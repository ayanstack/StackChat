import { Router } from "express";
import * as placesController from "../controllers/places.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  placesSearchSchema,
  placeDetailsSchema,
} from "../validations/places.validation.js";

const router = Router();

router.use(verifyJWT);

router.post("/search", validate(placesSearchSchema), placesController.search);
router.get("/details/:placeId", validate(placeDetailsSchema), placesController.getDetails);

export default router;
