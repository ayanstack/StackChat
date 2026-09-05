import getAIProvider from "../ai/aiProvider.factory.js";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export const analyzeImage = async ({ file, imageUrl, imageBase64, mimeType, prompt }) => {
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(503, "Vision provider (Gemini API) is NOT_CONFIGURED on the server");
  }

  const provider = getAIProvider("gemini");
  const userPrompt = prompt || "Describe this image in detail and identify all key objects, text, and context.";

  const images = [];

  if (file) {
    images.push({
      url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      mimeType: file.mimetype,
    });
  } else if (imageUrl) {
    images.push({
      url: imageUrl,
      mimeType: mimeType || "image/jpeg",
    });
  } else if (imageBase64) {
    const formattedUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;
    images.push({
      url: formattedUrl,
      mimeType: mimeType || "image/jpeg",
    });
  } else {
    throw ApiError.badRequest("Please provide an image file, imageUrl, or imageBase64");
  }

  const result = await provider.generateReply({
    messages: [{ role: "user", content: userPrompt }],
    systemPrompt: "You are an expert AI vision analyst. Provide accurate, structured, and detailed observations of the provided visual data.",
    model: "gemini-3.6-flash",
    images,
  });

  return {
    analysis: result.content,
    metadata: result.metadata,
  };
};

export default {
  analyzeImage,
};
