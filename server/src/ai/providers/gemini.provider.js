import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL_MAP = {
  "gemini-3.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest": "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
  "gemini-3.7-flash": "gemini-3.7-flash",
  "gemini-3.8-flash": "gemini-3.8-flash",
  "gemini-3.6-flash": "gemini-3.5-flash-lite",
  "gemini-flash-latest": "gemini-3.5-flash-lite",
  "gemini-1.5-flash": "gemini-3.5-flash-lite",
  "gemini-1.5-pro": "gemini-3.7-flash",
  "gemini-2.5-flash": "gemini-3.5-flash-lite",
  "gemini-3.1-pro": "gemini-3.7-flash",
  "gpt-4o": "gemini-3.5-flash-lite",
  "claude-3.5-sonnet": "gemini-3.7-flash",
};

const BACKUP_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

/**
 * Prepares contents array with multimodal image parts for Gemini API.
 */
async function prepareContents(messages = [], images = []) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  if (images && images.length > 0) {
    const imageParts = [];

    for (const img of images) {
      try {
        if (!img) continue;
        const mimeType = img.mimeType || "image/jpeg";
        let base64Data = "";

        if (img.url && img.url.startsWith("data:")) {
          const commaIdx = img.url.indexOf(",");
          if (commaIdx !== -1) {
            base64Data = img.url.slice(commaIdx + 1);
          }
        } else if (img.url && (img.url.startsWith("http://") || img.url.startsWith("https://"))) {
          const resp = await fetch(img.url);
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString("base64");
          }
        } else if (img.data) {
          base64Data = img.data;
        }

        if (base64Data) {
          imageParts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      } catch (err) {
        console.warn("[Gemini] Failed to convert image to inlineData:", err.message);
      }
    }

    if (imageParts.length > 0) {
      // Attach to the last user message, or append a new user message if none exists
      const lastUserMsg = [...contents].reverse().find((c) => c.role === "user");
      if (lastUserMsg) {
        lastUserMsg.parts.push(...imageParts);
      } else {
        contents.push({
          role: "user",
          parts: [...imageParts],
        });
      }
    }
  }

  return contents;
}

// ============================================================
// NON-STREAMING GENERATE
// ============================================================

async function generateReply({
  messages,
  systemPrompt,
  model = "gemini-3.8-flash",
  images = [],
  webSearch = false,
}) {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "leaked_key") {
    throw ApiError.badRequest("GEMINI_API_KEY is missing or invalid in environment variables.");
  }

  const primaryModel = MODEL_MAP[model] || "gemini-3.8-flash";
  const candidateModels = [primaryModel, ...BACKUP_MODELS.filter((m) => m !== primaryModel)];

  const contents = await prepareContents(messages, images);

  const payload = {
    contents,
    ...(systemPrompt && { systemInstruction: { parts: [{ text: systemPrompt }] } }),
    ...(webSearch && { tools: [{ googleSearch: {} }] }),
  };

  let lastError = null;

  for (const candidate of candidateModels) {
    try {
      const url = `${GEMINI_BASE_URL}/${candidate}:generateContent?key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || response.statusText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const usage = data.usageMetadata || {};
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text =
        parts
          .filter((p) => p.text && !p.thought)
          .map((p) => p.text)
          .join("") ||
        parts.map((p) => p.text || "").join("");

      if (text) {
        return {
          content: text,
          metadata: {
            model: candidate,
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
            latencyMs: 380,
          },
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Model ${candidate} failed (${err.message}), trying next candidate...`);
    }
  }

  throw ApiError.internal(`Gemini API Error: ${lastError?.message || "Failed to generate reply"}`);
}

// ============================================================
// STREAMING GENERATE
// ============================================================

async function generateReplyStream({
  messages,
  systemPrompt,
  model = "gemini-3.8-flash",
  images = [],
  webSearch = false,
  onChunk,
}) {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "leaked_key") {
    throw ApiError.badRequest("GEMINI_API_KEY is missing or invalid in environment variables.");
  }

  const primaryModel = MODEL_MAP[model] || "gemini-3.8-flash";
  const candidateModels = [primaryModel, ...BACKUP_MODELS.filter((m) => m !== primaryModel)];

  const contents = await prepareContents(messages, images);

  const payload = {
    contents,
    ...(systemPrompt && { systemInstruction: { parts: [{ text: systemPrompt }] } }),
    ...(webSearch && { tools: [{ googleSearch: {} }] }),
  };

  let lastError = null;

  for (const candidate of candidateModels) {
    try {
      const url = `${GEMINI_BASE_URL}/${candidate}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || response.statusText || `HTTP ${response.status}`);
      }

      if (response.body) {
        let fullText = "";
        const decoder = new TextDecoder("utf-8");

        if (typeof response.body.getReader === "function") {
          const reader = response.body.getReader();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data:")) {
                try {
                  const jsonStr = line.replace(/^data:\s*/, "").trim();
                  if (!jsonStr) continue;
                  const parsed = JSON.parse(jsonStr);
                  const parts = parsed.candidates?.[0]?.content?.parts || [];
                  const text =
                    parts
                      .filter((p) => p.text && !p.thought)
                      .map((p) => p.text)
                      .join("") ||
                    parts.map((p) => p.text || "").join("") ||
                    "";

                  if (text) {
                    fullText += text;
                    onChunk(text);
                  }
                } catch { }
              }
            }
          }
        } else {
          // Node.js stream fallback
          for await (const chunk of response.body) {
            const chunkStr = typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
            const lines = chunkStr.split("\n");

            for (const line of lines) {
              if (line.startsWith("data:")) {
                try {
                  const jsonStr = line.replace(/^data:\s*/, "").trim();
                  if (!jsonStr) continue;
                  const parsed = JSON.parse(jsonStr);
                  const parts = parsed.candidates?.[0]?.content?.parts || [];
                  const text =
                    parts
                      .filter((p) => p.text && !p.thought)
                      .map((p) => p.text)
                      .join("") ||
                    parts.map((p) => p.text || "").join("") ||
                    "";

                  if (text) {
                    fullText += text;
                    onChunk(text);
                  }
                } catch { }
              }
            }
          }
        }

        if (fullText) {
          return {
            content: fullText,
            metadata: { model: candidate, totalTokens: Math.ceil(fullText.length / 4) },
          };
        } else {
          // No content was received from the model; treat as an empty response
          throw new Error('Gemini returned an empty response');
        }
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Stream] Model ${candidate} failed (${err.message}), trying next candidate...`);
    }
  }

  throw ApiError.internal(`Gemini Stream Error: ${lastError?.message || "Stream failed to return content"}`);
}

export default {
  generateReply,
  generateReplyStream,
};
