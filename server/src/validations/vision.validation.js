import { z } from "zod";

export const analyzeImageSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required").max(4000).optional(),
    imageUrl: z.string().url("Invalid Image URL").optional(),
    imageBase64: z.string().optional(),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).optional(),
  }),
});
