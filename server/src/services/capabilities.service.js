import { env } from "../config/env.js";

export const getSystemCapabilities = async (user) => {
  const isGeminiConfigured = Boolean(env.GEMINI_API_KEY);
  const isOpenAIConfigured = Boolean(env.OPENAI_API_KEY);
  const isClaudeConfigured = Boolean(env.CLAUDE_API_KEY);
  const isDeepseekConfigured = Boolean(env.DEEPSEEK_API_KEY);

  const capabilities = {
    chat: {
      enabled: true,
      streaming: true,
      provider: env.AI_PROVIDER || "gemini",
      configured: isGeminiConfigured || isOpenAIConfigured,
      models: [
        {
          id: "gemini-3.5-flash-lite",
          name: "Gemini 3.5 Flash-Lite",
          provider: "gemini",
          contextWindow: 1048576,
          isDefault: true,
          supportsVision: true,
          supportsStreaming: true,
        },
        {
          id: "gemini-3.7-flash",
          name: "Gemini 3.7 Flash",
          provider: "gemini",
          contextWindow: 2097152,
          isDefault: false,
          supportsVision: true,
          supportsStreaming: true,
        },
        {
          id: "gemini-3.8-flash",
          name: "Gemini 3.8 Flash",
          provider: "gemini",
          contextWindow: 1048576,
          isDefault: false,
          supportsVision: true,
          supportsStreaming: true,
        },
      ],
    },
    memory: {
      enabled: true,
      status: "ACTIVE",
      description: "Persistent cross-conversation user memory",
      categories: ["preference", "fact", "instruction", "profile", "other"],
    },
    csvAnalysis: {
      enabled: true,
      status: "ACTIVE",
      description: "In-memory data processing, statistics, aggregation, filtering, and chart generation",
      supportedCharts: ["bar", "line", "pie", "area"],
    },
    vision: {
      enabled: isGeminiConfigured,
      status: isGeminiConfigured ? "ACTIVE" : "NOT_CONFIGURED",
      provider: "gemini",
      supportedMimeTypes: [
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
      ],
      maxFileSizeMb: 25,
    },
    imageGeneration: {
      enabled: true,
      status: "ACTIVE",
      provider: isOpenAIConfigured ? "dall-e-3" : "flux-ai",
      supportedSizes: ["1024x1024", "1024x1792", "1792x1024"],
    },
    webSearch: {
      enabled: Boolean(process.env.TAVILY_API_KEY || process.env.SERP_API_KEY || isGeminiConfigured),
      status: Boolean(process.env.TAVILY_API_KEY || process.env.SERP_API_KEY || isGeminiConfigured) ? "ACTIVE" : "NOT_CONFIGURED",
      provider: process.env.TAVILY_API_KEY ? "tavily" : isGeminiConfigured ? "gemini-grounding" : "none",
    },
    places: {
      enabled: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      status: Boolean(process.env.GOOGLE_MAPS_API_KEY) ? "ACTIVE" : "NOT_CONFIGURED",
      provider: "google-places",
    },
    voice: {
      stt: {
        enabled: isOpenAIConfigured || Boolean(process.env.GROQ_API_KEY),
        status: isOpenAIConfigured || Boolean(process.env.GROQ_API_KEY) ? "ACTIVE" : "NOT_CONFIGURED",
        provider: isOpenAIConfigured ? "whisper-1" : "none",
      },
      tts: {
        enabled: isOpenAIConfigured || Boolean(process.env.ELEVENLABS_API_KEY),
        status: isOpenAIConfigured || Boolean(process.env.ELEVENLABS_API_KEY) ? "ACTIVE" : "NOT_CONFIGURED",
        provider: isOpenAIConfigured ? "tts-1" : "none",
      },
    },
    deepResearch: {
      enabled: isGeminiConfigured,
      status: isGeminiConfigured ? "ACTIVE" : "NOT_CONFIGURED",
      features: ["multi-step-search", "source-aggregation", "citation-generation", "structured-report"],
    },
    integrations: {
      googleDrive: {
        configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        status: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? "AVAILABLE" : "NOT_CONFIGURED",
      },
      github: {
        configured: Boolean(process.env.GITHUB_CLIENT_ID),
        status: Boolean(process.env.GITHUB_CLIENT_ID) ? "AVAILABLE" : "NOT_CONFIGURED",
      },
      notion: {
        configured: Boolean(process.env.NOTION_API_KEY),
        status: Boolean(process.env.NOTION_API_KEY) ? "AVAILABLE" : "NOT_CONFIGURED",
      },
    },
  };

  return {
    version: env.API_VERSION || "v1",
    timestamp: new Date().toISOString(),
    capabilities,
  };
};

export default {
  getSystemCapabilities,
};
