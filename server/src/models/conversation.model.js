import mongoose from "mongoose";
import { CONVERSATION_STATUS } from "../constants/enums.js";

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Conversation",
      trim: true,
      maxLength: 150,
    },
    model: {
      type: String,
      default: "gemini-1.5-flash",
    },
    systemPrompt: {
      type: String,
      default: "",
      maxlength: 4000,
    },
    isPinned: { type: Boolean, default: false },
    isFavourite: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ user: 1, title: "text" });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;