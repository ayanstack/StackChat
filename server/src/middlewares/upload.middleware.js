import multer from "multer";
import ApiError from "../utils/ApiError.js";

export const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/comma-separated-values", "application/csv", "text/plain"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/m4a", "audio/x-m4a", "audio/mp4"],
};

const ALL_ALLOWED = Array.from(new Set(Object.values(ALLOWED_MIME_TYPES).flat()));
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    ALL_ALLOWED.includes(file.mimetype) ||
    file.originalname.endsWith(".csv") ||
    file.originalname.endsWith(".mp3") ||
    file.originalname.endsWith(".wav") ||
    file.originalname.endsWith(".m4a") ||
    file.originalname.endsWith(".webm")
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
