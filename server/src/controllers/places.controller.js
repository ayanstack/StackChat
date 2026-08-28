import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import placesService from "../services/places.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const search = asyncHandler(async (req, res) => {
  const result = await placesService.searchPlaces(req.body);
  new ApiResponse(HTTP_STATUS.OK, result, "Places search completed successfully").send(res);
});

export const getDetails = asyncHandler(async (req, res) => {
  const result = await placesService.getPlaceDetails(req.params.placeId);
  new ApiResponse(HTTP_STATUS.OK, result, "Place details fetched successfully").send(res);
});

export default {
  search,
  getDetails,
};
