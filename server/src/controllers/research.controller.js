import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import researchService from "../services/research.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const research = asyncHandler(async (req, res) => {
  const result = await researchService.performDeepResearch(req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Deep research completed successfully").send(res);
});

export default {
  research,
};
