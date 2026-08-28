import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import analyticsService from "../services/analytics.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getMyStats = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getUserStats(req.user._id);
  new ApiResponse(HTTP_STATUS.OK, stats, "Stats fetched successfully").send(res);
});

export const getMyDailyUsage = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const dailyUsage = await analyticsService.getDailyUsage(req.user._id, days);
  new ApiResponse(HTTP_STATUS.OK, { dailyUsage }, "Daily usage fetched successfully").send(res);
});

export const getMyMonthlyUsage = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 6;
  const monthlyUsage = await analyticsService.getMonthlyUsage(req.user._id, months);
  new ApiResponse(HTTP_STATUS.OK, { monthlyUsage }, "Monthly usage fetched successfully").send(res);
});




// import asyncHandler from "../utils/asyncHandler.js";
// import ApiResponse from "../utils/ApiResponse.js";
// import { HTTP_STATUS } from "../constants/httpStatus.js";
// import { getUsageSummary } from "../services/analytics.service.js";

// export const getSummaryController = asyncHandler(async (req, res) => {
//   const summary = await getUsageSummary(req.user._id);

//   new ApiResponse(
//     HTTP_STATUS.OK,
//     summary,
//     "Usage summary fetched successfully"
//   ).send(res);
// });