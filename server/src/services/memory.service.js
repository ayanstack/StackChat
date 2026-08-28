import Memory from "../models/memory.model.js";
import ApiError from "../utils/ApiError.js";

export const createMemory = async (userId, data) => {
  const memory = await Memory.create({
    user: userId,
    key: data.key,
    value: data.value,
    category: data.category || "fact",
    enabled: data.enabled !== undefined ? data.enabled : true,
  });
  return memory;
};

export const getMemories = async (userId, query = {}) => {
  const filter = { user: userId };
  if (query.category) filter.category = query.category;
  if (query.enabled !== undefined) filter.enabled = query.enabled === "true" || query.enabled === true;

  const memories = await Memory.find(filter).sort({ createdAt: -1 });
  return memories;
};

export const getMemoryById = async (userId, memoryId) => {
  const memory = await Memory.findOne({ _id: memoryId, user: userId });
  if (!memory) {
    throw ApiError.notFound("Memory not found");
  }
  return memory;
};

export const updateMemory = async (userId, memoryId, updates) => {
  const memory = await Memory.findOne({ _id: memoryId, user: userId });
  if (!memory) {
    throw ApiError.notFound("Memory not found");
  }

  if (updates.key !== undefined) memory.key = updates.key;
  if (updates.value !== undefined) memory.value = updates.value;
  if (updates.category !== undefined) memory.category = updates.category;
  if (updates.enabled !== undefined) memory.enabled = updates.enabled;

  await memory.save();
  return memory;
};

export const deleteMemory = async (userId, memoryId) => {
  const memory = await Memory.findOneAndDelete({ _id: memoryId, user: userId });
  if (!memory) {
    throw ApiError.notFound("Memory not found");
  }
  return memory;
};

export const getActiveMemoriesContext = async (userId) => {
  if (!userId) return "";
  const memories = await Memory.find({ user: userId, enabled: true }).lean();
  if (!memories.length) return "";

  const memoryLines = memories.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
  return `\n\n[Persistent User Memories & Context]:\n${memoryLines.join("\n")}`;
};

export default {
  createMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  getActiveMemoriesContext,
};
