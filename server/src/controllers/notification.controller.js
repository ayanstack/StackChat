import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import notificationService from "../services/notification.service.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user._id,
    req.query
  );

  new ApiResponse(
    HTTP_STATUS.OK,
    result,
    "Notifications fetched successfully"
  ).send(res);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user._id,
    req.params.id
  );

  new ApiResponse(
    HTTP_STATUS.OK,
    { notification },
    "Notification marked as read"
  ).send(res);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  new ApiResponse(
    HTTP_STATUS.OK,
    {},
    result.message
  ).send(res);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.user._id,
    req.params.id
  );

  new ApiResponse(
    HTTP_STATUS.OK,
    {},
    result.message
  ).send(res);
});











// import asyncHandler from "../utils/asyncHandler.js";
// import ApiResponse from "../utils/ApiResponse.js";
// import notificationService from "../services/notification.service.js";
// import { HTTP_STATUS } from "../constants/httpStatus.js";

// export const listNotifications = asyncHandler(async (req, res) => {
//   const result = await notificationService.listNotifications(req.user._id, req.query);
//   new ApiResponse(HTTP_STATUS.OK, result, "Notifications fetched successfully").send(res);
// });

// export const markAsRead = asyncHandler(async (req, res) => {
//   const notification = await notificationService.markAsRead(req.user._id, req.params.id);
//   new ApiResponse(HTTP_STATUS.OK, { notification }, "Notification marked as read").send(res);
// });

// export const markAllAsRead = asyncHandler(async (req, res) => {
//   const result = await notificationService.markAllAsRead(req.user._id);
//   new ApiResponse(HTTP_STATUS.OK, {}, result.message).send(res);
// });

// export const deleteNotification = asyncHandler(async (req, res) => {
//   const result = await notificationService.deleteNotification(req.user._id, req.params.id);
//   new ApiResponse(HTTP_STATUS.OK, {}, result.message).send(res);
// });