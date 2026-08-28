import mongoose from "mongoose";
import { FILE_TYPES } from "../constants/enums.js";

const attachmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    fileType: {
      type: String,
      enum: Object.values(FILE_TYPES),
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: "",
    },
    analysisStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "skipped"],
      default: "pending",
    },
  },
  { timestamps: true }
);

attachmentSchema.index({ user: 1, createdAt: -1 });
attachmentSchema.index({ conversation: 1 });
attachmentSchema.index({ originalName: "text" });

const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;