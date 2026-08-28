import { Router } from "express";

import * as notificationController from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  notificationIdParamSchema,
  listNotificationsSchema,
} from "../validations/notification.validation.js";

const router = Router();

// All notification routes require authentication
router.use(verifyJWT);

// GET /api/v1/notifications
router.get(
  "/",
  validate(listNotificationsSchema),
  notificationController.listNotifications
);

// PATCH /api/v1/notifications/read-all
router.patch(
  "/read-all",
  notificationController.markAllAsRead
);

// PATCH /api/v1/notifications/:id/read
router.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);

// DELETE /api/v1/notifications/:id
router.delete(
  "/:id",
  validate(notificationIdParamSchema),
  notificationController.deleteNotification
);

export default router;



// import { Router } from "express";
// import * as notificationController from "../controllers/notification.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import validate from "../middlewares/validate.middleware.js";
// import {
//   notificationIdParamSchema,
//   listNotificationsSchema,
// } from "../validations/notification.validation.js";

// const router = Router();

// router.use(verifyJWT);

// router.get("/", validate(listNotificationsSchema), notificationController.listNotifications);
// router.patch("/read-all", notificationController.markAllAsRead);
// router.patch("/:id/read", validate(notificationIdParamSchema), notificationController.markAsRead);
// router.delete("/:id", validate(notificationIdParamSchema), notificationController.deleteNotification);

// export default router;