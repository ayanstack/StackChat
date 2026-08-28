export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

export const MESSAGE_ROLES = Object.freeze({
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
});

export const MESSAGE_STATUS = Object.freeze({
  PENDING: "pending",
  STREAMING: "streaming",
  COMPLETED: "completed",
  FAILED: "failed",
  STOPPED: "stopped",
});

export const AI_PROVIDERS = Object.freeze({
  OPENAI: "openai",
  GEMINI: "gemini",
  DEEPSEEK: "deepseek",
  CLAUDE: "claude",
});

export const FILE_TYPES = Object.freeze({
  IMAGE: "image",
  PDF: "pdf",
  DOCX: "docx",
  TXT: "txt",
});

export const CONVERSATION_STATUS = Object.freeze({
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
});