import OpenAI from "openai";
import { env } from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export const generateImage = async ({ prompt, n = 1, size = "1024x1024", quality = "standard", style = "vivid" }) => {
  if (env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1, // DALL-E 3 supports n=1
        size,
        quality,
        style,
        response_format: "url",
      });

      return {
        provider: "openai-dalle-3",
        prompt,
        images: response.data.map((img) => ({
          url: img.url,
          revisedPrompt: img.revised_prompt,
        })),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw ApiError.internal(`OpenAI Image Generation error: ${error.message}`);
    }
  }

  if (process.env.STABILITY_API_KEY) {
    try {
      const response = await fetch(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: n,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || response.statusText);
      }

      const data = await response.json();
      return {
        provider: "stability-ai",
        prompt,
        images: data.artifacts.map((art) => ({
          base64: art.base64,
          mimeType: "image/png",
        })),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw ApiError.internal(`Stability AI error: ${error.message}`);
    }
  }

  // Free Fallback Image Generator (No API Key Required)
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&width=1024&height=1024`;
    
    return {
      provider: "pollinations-ai",
      prompt,
      images: [{
        url: imageUrl,
        revisedPrompt: prompt
      }],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    throw ApiError.internal(`Image Generation error: ${error.message}`);
  }
};

export default {
  generateImage,
};
