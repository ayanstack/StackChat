import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";

async function createNotification(userId, { title, message, type, link }) {
  return Notification.create({ user: userId, title, message, type, link });
}

async function listNotifications(userId, { page, limit, unreadOnly }) {
  const query = { user: userId };
  if (unreadOnly) query.isRead = false;

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) throw ApiError.notFound("Notification not found");

  notification.isRead = true;
  await notification.save();

  return notification;
}

async function markAllAsRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  return { message: "All notifications marked as read" };
}

async function deleteNotification(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) throw ApiError.notFound("Notification not found");

  await notification.deleteOne();
  return { message: "Notification deleted" };
}

export default { createNotification, listNotifications, markAsRead, markAllAsRead, deleteNotification };