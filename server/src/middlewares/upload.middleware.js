import multer from "multer";
import ApiError from "../utils/ApiError.js";

export const ALLOWED_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
    "image/heic",
    "image/heif",
    "image/x-icon",
  ],
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  txt: ["text/plain", "text/markdown", "application/json"],
  csv: [
    "text/csv",
    "application/vnd.ms-excel",
    "text/comma-separated-values",
    "application/csv",
    "text/plain",
  ],
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
  ],
};

const ALL_ALLOWED = Array.from(new Set(Object.values(ALLOWED_MIME_TYPES).flat()));
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype.startsWith("text/") ||
    ALL_ALLOWED.includes(file.mimetype) ||
    file.originalname.match(/\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff|svg|heic|pdf|docx|doc|txt|csv|json|mp3|wav|m4a|webm|ogg)$/i)
  ) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

export default upload;
