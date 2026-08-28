import { z } from "zod";

export const generateImageSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt is too long"),
    n: z.number().int().min(1).max(4).optional().default(1),
    size: z.enum(["1024x1024", "1024x1792", "1792x1024", "512x512", "256x256"]).optional().default("1024x1024"),
    quality: z.enum(["standard", "hd"]).optional().default("standard"),
    style: z.enum(["vivid", "natural"]).optional().default("vivid"),
  }),
});
