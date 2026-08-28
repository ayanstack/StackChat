import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["preference", "fact", "instruction", "profile", "other"],
      default: "fact",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ user: 1, key: 1 });

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;
