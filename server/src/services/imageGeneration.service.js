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
      console.warn("OpenAI Image Generation failed, using high-speed Flux fallback:", error.message);
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
      console.warn("Stability AI failed, using high-speed Flux fallback:", error.message);
    }
  }

  // High-Quality Fallback AI Image Generator (Pollinations Flux / Turbo)
  try {
    let width = 1024;
    let height = 1024;

    if (size && typeof size === "string" && size.includes("x")) {
      const parts = size.split("x");
      width = parseInt(parts[0], 10) || 1024;
      height = parseInt(parts[1], 10) || 1024;
    }

    const seed = Math.floor(Math.random() * 10000000);
    const enhancedPrompt = style === "vivid" ? `${prompt}, highly detailed, 8k resolution, cinematic lighting, masterpiece` : `${prompt}, natural lighting, photorealistic, clean details`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&width=${width}&height=${height}&seed=${seed}&model=flux`;
    
    return {
      provider: "flux-ai",
      prompt,
      images: [{
        url: imageUrl,
        revisedPrompt: enhancedPrompt,
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
