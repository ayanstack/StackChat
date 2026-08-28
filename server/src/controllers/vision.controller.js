import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import visionService from "../services/vision.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const analyzeImage = asyncHandler(async (req, res) => {
  const { prompt, imageUrl, imageBase64, mimeType } = req.body || {};
  const file = req.file;

  const result = await visionService.analyzeImage({
    file,
    imageUrl,
    imageBase64,
    mimeType,
    prompt,
  });

  new ApiResponse(HTTP_STATUS.OK, result, "Image analyzed successfully").send(res);
});

export default {
  analyzeImage,
};
