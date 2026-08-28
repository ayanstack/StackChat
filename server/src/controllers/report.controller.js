import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import reportService from "../services/report.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user._id, req.body);
  new ApiResponse(HTTP_STATUS.CREATED, { report }, "Report submitted successfully").send(res);
});

export const listReports = asyncHandler(async (req, res) => {
  const result = await reportService.listReports(req.query);
  new ApiResponse(HTTP_STATUS.OK, result, "Reports fetched successfully").send(res);
});

export const resolveReport = asyncHandler(async (req, res) => {
  const report = await reportService.resolveReport(req.user._id, req.params.id, req.body);
  new ApiResponse(HTTP_STATUS.OK, { report }, "Report updated successfully").send(res);
});