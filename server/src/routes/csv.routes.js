import { Router } from "express";
import * as csvController from "../controllers/csv.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadRateLimiter } from "../middlewares/security.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  csvQuerySchema,
  csvAggregateSchema,
  csvChartSchema,
} from "../validations/csv.validation.js";

const router = Router();

router.use(verifyJWT);

// Upload and analyze CSV (either multipart file or JSON with csvText)
router.post(
  "/analyze",
  uploadRateLimiter,
  upload.single("file"),
  csvController.uploadAndAnalyze
);

// Query / Filter / Sort / Paginate CSV rows
router.post(
  "/query",
  validate(csvQuerySchema),
  csvController.queryCsv
);

// Aggregations (Sum, Avg, Min, Max, Count)
router.post(
  "/aggregate",
  validate(csvAggregateSchema),
  csvController.aggregateCsv
);

// Chart Data (Bar, Line, Pie, Area)
router.post(
  "/chart",
  validate(csvChartSchema),
  csvController.generateChart
);

export default router;
