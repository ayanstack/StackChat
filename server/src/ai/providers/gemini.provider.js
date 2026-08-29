import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL_MAP = {
  "gemini-1.5-flash": "gemini-1.5-flash",
  "gemini-1.5-pro": "gemini-1.5-pro",
  "gpt-4o": "gemini-1.5-pro", // Fallback to Gemini 1.5 Pro endpoint when using Gemini API key
  "claude-3.5-sonnet": "gemini-1.5-pro",
};

// ============================================================
// NON-STREAMING GENERATE
// ============================================================

async function generateReply({
  messages,
  systemPrompt,
  model = "gemini-1.5-flash",
  images = [],
}) {
  const targetModel = MODEL_MAP[model] || "gemini-1.5-flash";

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "leaked_key") {
    throw ApiError.badRequest("GEMINI_API_KEY is missing or invalid in environment variables.");
  }

  const url = `${GEMINI_BASE_URL}/${targetModel}:generateContent?key=${env.GEMINI_API_KEY}`;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(systemPrompt && { systemInstruction: { parts: [{ text: systemPrompt }] } }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw ApiError.internal(
      `Gemini API Error: ${errorData.error?.message || response.statusText || "Unknown Error"}`
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  
  if (!text) {
    throw ApiError.internal("Received empty response from Gemini API");
  }

  const usage = data.usageMetadata || {};
  return {
    content: text,
    metadata: {
      model: targetModel,
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      latencyMs: 450,
    },
  };
}

// ============================================================
// STREAMING GENERATE
// ============================================================

async function generateReplyStream({
  messages,
  systemPrompt,
  model = "gemini-1.5-flash",
  images = [],
  onChunk,
}) {
  const targetModel = MODEL_MAP[model] || "gemini-1.5-flash";

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "leaked_key") {
    throw ApiError.badRequest("GEMINI_API_KEY is missing or invalid in environment variables.");
  }

  const url = `${GEMINI_BASE_URL}/${targetModel}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(systemPrompt && { systemInstruction: { parts: [{ text: systemPrompt }] } }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw ApiError.internal(
      `Gemini API Error: ${errorData.error?.message || response.statusText || "Unknown Error"}`
    );
  }

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const parsed = JSON.parse(line.replace(/^data:\s*/, ""));
            const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
            if (text) {
              fullText += text;
              onChunk(text);
            }
          } catch {}
        }
      }
    }

    if (fullText) {
      return {
        content: fullText,
        metadata: { model: targetModel, totalTokens: fullText.length / 4 },
      };
    }
  }
  
  throw ApiError.internal("Stream failed to return content from Gemini API");
}

export default {
  generateReply,
  generateReplyStream,
};
