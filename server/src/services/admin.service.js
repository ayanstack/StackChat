import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Attachment from "../models/attachment.model.js";
import ApiError from "../utils/ApiError.js";

async function getDashboardStats() {
  const [totalUsers, totalConversations, totalMessages, totalFiles, activeUsersToday] =
    await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Conversation.countDocuments(),
      Message.countDocuments({ isDeleted: false }),
      Attachment.countDocuments(),
      Message.distinct("user", {
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }).then((users) => users.length),
    ]);

  return { totalUsers, totalConversations, totalMessages, totalFiles, activeUsersToday };
}

async function listUsers({ page, limit, search }) {
  const query = { isDeleted: false };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getUserDetail(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw ApiError.notFound("User not found");

  const [conversationCount, messageCount] = await Promise.all([
    Conversation.countDocuments({ user: userId }),
    Message.countDocuments({ user: userId, isDeleted: false }),
  ]);

  return { user, conversationCount, messageCount };
}

async function banUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  user.isDeleted = true;
  await user.save();

  return { message: "User has been banned/deactivated" };
}

async function unbanUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  user.isDeleted = false;
  await user.save();

  return { message: "User has been reactivated" };
}

async function listAllConversations({ page, limit }) {
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    Conversation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
    Conversation.countDocuments(),
  ]);

  return { conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function listAllFiles({ page, limit }) {
  const skip = (page - 1) * limit;

  const [files, total] = await Promise.all([
    Attachment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
    Attachment.countDocuments(),
  ]);

  return { files, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export default {
  getDashboardStats,
  listUsers,
  getUserDetail,
  banUser,
  unbanUser,
  listAllConversations,
  listAllFiles,
};