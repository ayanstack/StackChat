import Folder from "../models/folder.model.js";
import Conversation from "../models/conversation.model.js";
import ApiError from "../utils/ApiError.js";

async function createFolder(userId, { name, color }) {
  return Folder.create({ user: userId, name, color });
}

async function listFolders(userId) {
  const folders = await Folder.find({ user: userId }).sort({ createdAt: -1 }).lean();

  const counts = await Conversation.aggregate([
    { $match: { user: userId, folder: { $ne: null } } },
    { $group: { _id: "$folder", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  return folders.map((f) => ({ ...f, conversationCount: countMap[f._id.toString()] || 0 }));
}

async function updateFolder(userId, folderId, updates) {
  const folder = await Folder.findOne({ _id: folderId, user: userId });
  if (!folder) throw ApiError.notFound("Folder not found");

  Object.assign(folder, updates);
  await folder.save();

  return folder;
}

async function deleteFolder(userId, folderId) {
  const folder = await Folder.findOne({ _id: folderId, user: userId });
  if (!folder) throw ApiError.notFound("Folder not found");

  await Conversation.updateMany({ folder: folderId }, { folder: null });
  await folder.deleteOne();

  return { message: "Folder deleted, conversations moved to Unfiled" };
}

async function moveConversation(userId, conversationId, folderId) {
  const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  if (folderId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId });
    if (!folder) throw ApiError.notFound("Folder not found");
  }

  conversation.folder = folderId || null;
  await conversation.save();

  return conversation;
}

export default { createFolder, listFolders, updateFolder, deleteFolder, moveConversation };