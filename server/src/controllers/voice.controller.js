import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import voiceService from "../services/voice.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const speechToText = asyncHandler(async (req, res) => {
  const result = await voiceService.speechToText(req.file);
  new ApiResponse(HTTP_STATUS.OK, result, "Audio transcribed successfully").send(res);
});

export const textToSpeech = asyncHandler(async (req, res) => {
  const result = await voiceService.textToSpeech(req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Speech synthesized successfully").send(res);
});

export default {
  speechToText,
  textToSpeech,
};
