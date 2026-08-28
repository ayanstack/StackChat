import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import webSearchService from "../services/webSearch.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const search = asyncHandler(async (req, res) => {
  const result = await webSearchService.searchWeb(req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Web search completed successfully").send(res);
});

export default {
  search,
};
