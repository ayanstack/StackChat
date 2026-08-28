import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import capabilitiesService from "../services/capabilities.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getCapabilities = asyncHandler(async (req, res) => {
  const result = await capabilitiesService.getSystemCapabilities(req.user);
  new ApiResponse(HTTP_STATUS.OK, result, "Capabilities fetched successfully").send(res);
});

export default {
  getCapabilities,
};
