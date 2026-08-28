import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/me", analyticsController.getMyStats);
router.get("/me/daily", analyticsController.getMyDailyUsage);
router.get("/me/monthly", analyticsController.getMyMonthlyUsage);

export default router;


// import { Router } from "express";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { getSummaryController } from "../controllers/analytics.controller.js";

// const router = Router();

// router.use(verifyJWT);

// router.get("/summary", getSummaryController);

// export default router;