import { env } from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const FALLBACK_GEMINI_MODEL = "gemini-1.5-flash-8b";


// ============================================================
// URL -> BASE64
// ============================================================

async function urlToBase64(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download image: ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer).toString("base64");
}


// ============================================================
// BUILD GEMINI CONTENTS
// ============================================================

function buildContents(messages = []) {
  return messages.map((message) => ({
    role:
      message.role === "assistant"
        ? "model"
        : "user",

    parts: [
      {
        text: message.content || "",
      },
    ],
  }));
}


// ============================================================
// ATTACH IMAGES
// ============================================================

async function attachImages(contents, images = []) {
  if (!images.length || !contents.length) {
    return contents;
  }

  const lastContent =
    contents[contents.length - 1];

  for (const image of images) {
    const base64Data =
      await urlToBase64(image.url);

    lastContent.parts.push({
      inlineData: {
        mimeType:
          image.mimeType || "image/jpeg",
        data: base64Data,
      },
    });
  }

  return contents;
}


// ============================================================
// CHECK API KEY
// ============================================================

function validateApiKey() {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.internal(
      "Gemini API key is not configured on the server"
    );
  }
}


// ============================================================
// BUILD URL
// ============================================================

function buildUrl(model, endpoint, streaming = false) {
  if (streaming) {
    return `${GEMINI_BASE_URL}/${model}:${endpoint}?alt=sse&key=${env.GEMINI_API_KEY}`;
  }

  return `${GEMINI_BASE_URL}/${model}:${endpoint}?key=${env.GEMINI_API_KEY}`;
}


// ============================================================
// WAIT
// ============================================================

function wait(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}


// ============================================================
// NON-STREAMING
// ============================================================

async function generateReply({
  messages,
  systemPrompt,
  model = DEFAULT_GEMINI_MODEL,
  images = [],
}) {
  validateApiKey();

  const contents = await attachImages(
    buildContents(messages),
    images
  );

  const models = [
    model,
    FALLBACK_GEMINI_MODEL,
  ];

  let lastError;

  for (const currentModel of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = buildUrl(
          currentModel,
          "generateContent"
        );

        const body = {
          contents,

          ...(systemPrompt && {
            systemInstruction: {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          }),
        };

        const startTime = Date.now();

        const response = await fetch(url, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(body),
        });

        const latencyMs =
          Date.now() - startTime;

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => ({}));

          const message =
            errorData.error?.message ||
            response.statusText;

          lastError = new Error(
            `Gemini API error: ${message}`
          );

          // Retry only temporary/high-demand errors
          if (
            response.status === 429 ||
            response.status === 503 ||
            message
              .toLowerCase()
              .includes("high demand")
          ) {
            await wait(attempt * 1500);
            continue;
          }

          throw lastError;
        }

        const data =
          await response.json();

        const replyText =
          data.candidates?.[0]
            ?.content?.parts
            ?.map(
              (part) => part.text || ""
            )
            .join("") || "";

        if (!replyText) {
          throw ApiError.internal(
            "Gemini did not return a valid response"
          );
        }

        const usage =
          data.usageMetadata || {};

        return {
          content: replyText,

          metadata: {
            model: currentModel,

            promptTokens:
              usage.promptTokenCount || 0,

            completionTokens:
              usage.candidatesTokenCount || 0,

            totalTokens:
              usage.totalTokenCount || 0,

            latencyMs,
          },
        };
      } catch (error) {
        lastError = error;

        if (attempt === 2) {
          break;
        }

        await wait(attempt * 1500);
      }
    }
  }

  throw ApiError.internal(
    lastError?.message ||
      "Gemini API request failed"
  );
}


// ============================================================
// STREAMING
// ============================================================

async function generateReplyStream({
  messages,
  systemPrompt,
  model = DEFAULT_GEMINI_MODEL,
  images = [],
  onChunk,
}) {
  validateApiKey();

  if (typeof onChunk !== "function") {
    throw ApiError.internal(
      "onChunk callback is required for streaming"
    );
  }

  const models = [
    model,
    FALLBACK_GEMINI_MODEL,
  ];

  let lastError;

  for (const currentModel of models) {
    try {
      const contents = await attachImages(
        buildContents(messages),
        images
      );

      const url = buildUrl(
        currentModel,
        "streamGenerateContent",
        true
      );

      const body = {
        contents,

        ...(systemPrompt && {
          systemInstruction: {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        }),
      };

      const startTime = Date.now();

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        const message =
          errorData.error?.message ||
          response.statusText;

        lastError = new Error(
          `Gemini API error: ${message}`
        );

        // Try fallback model
        if (
          response.status === 429 ||
          response.status === 503 ||
          message
            .toLowerCase()
            .includes("high demand")
        ) {
          continue;
        }

        throw lastError;
      }

      if (!response.body) {
        throw ApiError.internal(
          "Gemini response body is empty"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder("utf-8");

      let buffer = "";
      let fullText = "";
      let lastUsage = {};

      // ======================================================
      // READ STREAM
      // ======================================================

      while (true) {
        const { done, value } =
          await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          {
            stream: true,
          }
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";

        for (const line of lines) {
          const trimmed =
            line.trim();

          if (
            !trimmed.startsWith("data:")
          ) {
            continue;
          }

          const jsonString =
            trimmed.replace(
              /^data:\s*/,
              ""
            );

          if (!jsonString) {
            continue;
          }

          try {
            const parsed =
              JSON.parse(jsonString);

            const parts =
              parsed.candidates?.[0]
                ?.content?.parts || [];

            const text =
              parts
                .map(
                  (part) =>
                    part.text || ""
                )
                .join("");

            if (text) {
              fullText += text;

              onChunk(text);
            }

            if (
              parsed.usageMetadata
            ) {
              lastUsage =
                parsed.usageMetadata;
            }
          } catch {
            // Ignore incomplete SSE data
          }
        }
      }

      const latencyMs =
        Date.now() - startTime;

      if (!fullText) {
        throw ApiError.internal(
          "Gemini did not return a valid streamed response"
        );
      }

      return {
        content: fullText,

        metadata: {
          model: currentModel,

          promptTokens:
            lastUsage.promptTokenCount ||
            0,

          completionTokens:
            lastUsage.candidatesTokenCount ||
            0,

          totalTokens:
            lastUsage.totalTokenCount ||
            0,

          latencyMs,
        },
      };
    } catch (error) {
      lastError = error;

      // Try next model
      continue;
    }
  }

  throw ApiError.internal(
    lastError?.message ||
      "Gemini streaming request failed"
  );
}


// ============================================================
// EXPORT
// ============================================================

export default {
  generateReply,
  generateReplyStream,
};
