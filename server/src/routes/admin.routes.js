import { Router } from "express";

import * as adminController from "../controllers/admin.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

import validate from "../middlewares/validate.middleware.js";

import {
  userIdParamSchema,
  listUsersSchema,
} from "../validations/admin.validation.js";

import { USER_ROLES } from "../constants/enums.js";

const router = Router();

router.use(verifyJWT, authorizeRoles(USER_ROLES.ADMIN));

router.get("/dashboard", adminController.getDashboard);

router.get(
  "/users",
  validate(listUsersSchema),
  adminController.listUsers
);

router.get(
  "/users/:id",
  validate(userIdParamSchema),
  adminController.getUserDetail
);

router.patch(
  "/users/:id/ban",
  validate(userIdParamSchema),
  adminController.banUser
);

router.patch(
  "/users/:id/unban",
  validate(userIdParamSchema),
  adminController.unbanUser
);

router.get(
  "/conversations",
  adminController.listAllConversations
);

router.get(
  "/files",
  adminController.listAllFiles
);

export default router;