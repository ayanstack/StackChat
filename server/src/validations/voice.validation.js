import { z } from "zod";

export const textToSpeechSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Text is required").max(4096, "Text exceeds maximum 4096 characters"),
    voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional().default("alloy"),
    speed: z.number().min(0.25).max(4.0).optional().default(1.0),
    format: z.enum(["mp3", "opus", "aac", "flac"]).optional().default("mp3"),
  }),
});
