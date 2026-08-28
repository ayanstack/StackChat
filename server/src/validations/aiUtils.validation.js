import { z } from "zod";

export const textInputSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1, "Text is required").max(20000),
  }),
});

export const translateSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1, "Text is required").max(20000),
    targetLanguage: z.string().trim().min(1, "Target language is required"),
  }),
});

export const explainCodeSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, "Code is required").max(20000),
    language: z.string().trim().optional(),
  }),
});

export const customPromptSchema = z.object({
  body: z.object({
    systemPrompt: z.string().trim().min(1, "System prompt is required").max(4000),
    userMessage: z.string().trim().min(1, "Message is required").max(20000),
  }),
});