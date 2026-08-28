import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Attachment from "../models/attachment.model.js";
import { MESSAGE_ROLES } from "../constants/enums.js";

async function getUserStats(userId) {
  const [totalConversations, totalMessages, totalFiles, tokenStats] = await Promise.all([
    Conversation.countDocuments({ user: userId }),
    Message.countDocuments({ user: userId, isDeleted: false }),
    Attachment.countDocuments({ user: userId }),
    Message.aggregate([
      { $match: { user: userId, role: MESSAGE_ROLES.ASSISTANT, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$metadata.totalTokens" },
          totalPromptTokens: { $sum: "$metadata.promptTokens" },
          totalCompletionTokens: { $sum: "$metadata.completionTokens" },
          totalAIResponses: { $sum: 1 },
        },
      },
    ]),
  ]);

  const tokens = tokenStats[0] || {
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalAIResponses: 0,
  };

  return {
    totalConversations,
    totalMessages,
    totalFiles,
    totalAIResponses: tokens.totalAIResponses,
    tokenUsage: {
      total: tokens.totalTokens,
      prompt: tokens.totalPromptTokens,
      completion: tokens.totalCompletionTokens,
    },
  };
}

async function getDailyUsage(userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const dailyCounts = await Message.aggregate([
    { $match: { user: userId, isDeleted: false, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return dailyCounts.map((d) => ({ date: d._id, messageCount: d.count }));
}

async function getMonthlyUsage(userId, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const monthlyStats = await Message.aggregate([
    { $match: { user: userId, isDeleted: false, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        messageCount: { $sum: 1 },
        totalTokens: { $sum: "$metadata.totalTokens" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return monthlyStats.map((m) => ({
    month: m._id,
    messageCount: m.messageCount,
    totalTokens: m.totalTokens,
  }));
}

export default { getUserStats, getDailyUsage, getMonthlyUsage };



































// import Conversation from "../models/conversation.model.js";
// import Message from "../models/message.model.js";
// import mongoose from "mongoose";
// import { MESSAGE_ROLES } from "../constants/enums.js";

// export const getUsageSummary = async (userId) => {
//   const objectUserId = new mongoose.Types.ObjectId(userId);

//   const totalConversations = await Conversation.countDocuments({
//     user: objectUserId,
//   });

//   const conversationIds = await Conversation.find({
//     user: objectUserId,
//   }).distinct("_id");

//   const totalMessages = await Message.countDocuments({
//     conversation: { $in: conversationIds },
//     isDeleted: false,
//   });

//   const userMessagesCount = await Message.countDocuments({
//     conversation: { $in: conversationIds },
//     role: MESSAGE_ROLES.USER,
//     isDeleted: false,
//   });

//   const assistantMessagesCount = await Message.countDocuments({
//     conversation: { $in: conversationIds },
//     role: MESSAGE_ROLES.ASSISTANT,
//     isDeleted: false,
//   });

//   const failedMessagesCount = await Message.countDocuments({
//     conversation: { $in: conversationIds },
//     status: "failed",
//   });

//   const tokenAgg = await Message.aggregate([
//     {
//       $match: {
//         conversation: { $in: conversationIds },
//         role: MESSAGE_ROLES.ASSISTANT,
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalTokens: { $sum: "$metadata.totalTokens" },
//         totalPromptTokens: { $sum: "$metadata.promptTokens" },
//         totalCompletionTokens: { $sum: "$metadata.completionTokens" },
//       },
//     },
//   ]);

//   const tokenStats = tokenAgg[0] || {
//     totalTokens: 0,
//     totalPromptTokens: 0,
//     totalCompletionTokens: 0,
//   };

//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//   sevenDaysAgo.setHours(0, 0, 0, 0);

//   const dailyActivity = await Message.aggregate([
//     {
//       $match: {
//         conversation: { $in: conversationIds },
//         createdAt: { $gte: sevenDaysAgo },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   const mostActiveAgg = await Message.aggregate([
//     {
//       $match: {
//         conversation: { $in: conversationIds },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: { _id: "$conversation", messageCount: { $sum: 1 } },
//     },
//     { $sort: { messageCount: -1 } },
//     { $limit: 1 },
//   ]);

//   let mostActiveConversation = null;
//   if (mostActiveAgg.length > 0) {
//     const conv = await Conversation.findById(mostActiveAgg[0]._id).select("title");
//     mostActiveConversation = {
//       conversationId: mostActiveAgg[0]._id,
//       title: conv?.title || "Untitled",
//       messageCount: mostActiveAgg[0].messageCount,
//     };
//   }

//   return {
//     totalConversations,
//     totalMessages,
//     userMessagesCount,
//     assistantMessagesCount,
//     failedMessagesCount,
//     tokenUsage: {
//       totalTokens: tokenStats.totalTokens || 0,
//       totalPromptTokens: tokenStats.totalPromptTokens || 0,
//       totalCompletionTokens: tokenStats.totalCompletionTokens || 0,
//     },
//     dailyActivity: dailyActivity.map((d) => ({ date: d._id, messageCount: d.count })),
//     mostActiveConversation,
//   };
// };