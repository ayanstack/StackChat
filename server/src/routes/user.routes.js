import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateSettingsSchema,
} from "../validations/user.validation.js";

const router = Router();

router.use(verifyJWT);

router.get("/profile", userController.getProfile);
router.patch("/profile", validate(updateProfileSchema), userController.updateProfile);
router.patch("/password", validate(updatePasswordSchema), userController.updatePassword);
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);
router.patch("/settings", validate(updateSettingsSchema), userController.updateSettings);
router.delete("/account", userController.deleteAccount);

export default router;