import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createReportSchema,
  reportIdParamSchema,
  resolveReportSchema,
  listReportsSchema,
} from "../validations/report.validation.js";
import { USER_ROLES } from "../constants/enums.js";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createReportSchema), reportController.createReport);

router.get("/", authorizeRoles(USER_ROLES.ADMIN), validate(listReportsSchema), reportController.listReports);
router.patch(
  "/:id/resolve",
  authorizeRoles(USER_ROLES.ADMIN),
  validate(resolveReportSchema),
  reportController.resolveReport
);

export default router;