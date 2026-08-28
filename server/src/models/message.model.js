import mongoose from "mongoose";
import { MESSAGE_ROLES, MESSAGE_STATUS } from "../constants/enums.js";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(MESSAGE_ROLES),
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.COMPLETED,
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    metadata: {
      model: { type: String, default: "" },
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      latencyMs: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ content: "text" });

const Message = mongoose.model("Message", messageSchema);

export default Message;