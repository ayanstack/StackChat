import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import aiUtilsService from "../services/aiUtils.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const explainCode = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.explainCode(req.body.code, req.body.language);
  new ApiResponse(HTTP_STATUS.OK, result, "Code explained successfully").send(res);
});

export const summarizeText = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.summarizeText(req.body.text);
  new ApiResponse(HTTP_STATUS.OK, result, "Text summarized successfully").send(res);
});

export const translateText = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.translateText(req.body.text, req.body.targetLanguage);
  new ApiResponse(HTTP_STATUS.OK, result, "Text translated successfully").send(res);
});

export const rewriteText = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.rewriteText(req.body.text);
  new ApiResponse(HTTP_STATUS.OK, result, "Text rewritten successfully").send(res);
});

export const fixGrammar = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.fixGrammar(req.body.text);
  new ApiResponse(HTTP_STATUS.OK, result, "Grammar fixed successfully").send(res);
});

export const customPrompt = asyncHandler(async (req, res) => {
  const result = await aiUtilsService.customPrompt(req.body.systemPrompt, req.body.userMessage);
  new ApiResponse(HTTP_STATUS.OK, result, "Response generated successfully").send(res);
});