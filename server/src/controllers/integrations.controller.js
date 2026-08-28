import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import integrationsService from "../services/integrations.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getIntegrations = asyncHandler(async (req, res) => {
  const result = await integrationsService.getIntegrationsStatus(req.user);
  new ApiResponse(HTTP_STATUS.OK, result, "Integrations status fetched successfully").send(res);
});

export const connect = asyncHandler(async (req, res) => {
  const result = await integrationsService.connectIntegration(req.user, req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Integration connected successfully").send(res);
});

export const disconnect = asyncHandler(async (req, res) => {
  const result = await integrationsService.disconnectIntegration(req.user, req.params.provider);
  new ApiResponse(HTTP_STATUS.OK, result, "Integration disconnected successfully").send(res);
});

export default {
  getIntegrations,
  connect,
  disconnect,
};
