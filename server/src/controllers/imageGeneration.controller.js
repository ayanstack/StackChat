import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import imageGenerationService from "../services/imageGeneration.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const generateImage = asyncHandler(async (req, res) => {
  const result = await imageGenerationService.generateImage(req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Image generated successfully").send(res);
});

export default {
  generateImage,
};
