import cloudinary from "../config/cloudinary.js";
import Attachment from "../models/attachment.model.js";
import ApiError from "../utils/ApiError.js";
import { FILE_TYPES } from "../constants/enums.js";
import logger from "../logger/logger.js";

function detectFileType(mimeType = "") {
  if (mimeType.startsWith("image/")) return FILE_TYPES.IMAGE;
  if (mimeType === "application/pdf") return FILE_TYPES.PDF;
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return FILE_TYPES.DOCX;
  if (mimeType.startsWith("text/") || mimeType.includes("csv") || mimeType.includes("json")) return FILE_TYPES.TXT;
  return FILE_TYPES.IMAGE; // default fallback
}

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

async function uploadFile(userId, file, conversationId = null) {
  const fileType = detectFileType(file.mimetype);

  const resourceType = fileType === FILE_TYPES.IMAGE ? "image" : "raw";

  const uploadResult = await uploadBufferToCloudinary(file.buffer, {
    folder: `ai-chat-board/${userId}`,
    resource_type: resourceType,
  });

  const attachment = await Attachment.create({
    user: userId,
    conversation: conversationId,
    fileType,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    analysisStatus: "pending",
  });

  if (fileType !== FILE_TYPES.IMAGE) {
    extractTextInBackground(attachment._id, file.buffer, fileType);
  } else {
    attachment.analysisStatus = "skipped";
    await attachment.save();
  }

  return attachment;
}

async function extractTextInBackground(attachmentId, buffer, fileType) {
  try {
    let text = "";

    if (fileType === FILE_TYPES.PDF) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileType === FILE_TYPES.DOCX) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileType === FILE_TYPES.TXT) {
      text = buffer.toString("utf-8");
    }

    const trimmedText = text.slice(0, 20000);

    await Attachment.findByIdAndUpdate(attachmentId, {
      extractedText: trimmedText,
      analysisStatus: "completed",
    });
  } catch (error) {
    logger.error(`File text extraction failed for ${attachmentId}: ${error.message}`);
    await Attachment.findByIdAndUpdate(attachmentId, { analysisStatus: "failed" });
  }
}

async function getFileById(userId, fileId) {
  const attachment = await Attachment.findOne({ _id: fileId, user: userId });
  if (!attachment) {
    throw ApiError.notFound("File not found");
  }
  return attachment;
}

async function listFiles(userId) {
  return Attachment.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

async function deleteFile(userId, fileId) {
  const attachment = await getFileById(userId, fileId);

  const resourceType = attachment.fileType === FILE_TYPES.IMAGE ? "image" : "raw";
  await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });

  await attachment.deleteOne();
  return attachment;
}

export default {
  uploadFile,
  getFileById,
  listFiles,
  deleteFile,
};