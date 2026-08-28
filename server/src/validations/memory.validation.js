import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createMemorySchema = z.object({
  body: z.object({
    key: z.string().min(1, "Key is required").max(100, "Key is too long"),
    value: z.string().min(1, "Value is required").max(2000, "Value is too long"),
    category: z.enum(["preference", "fact", "instruction", "profile", "other"]).optional(),
    enabled: z.boolean().optional(),
  }),
});

export const updateMemorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Memory ID"),
  }),
  body: z.object({
    key: z.string().min(1).max(100).optional(),
    value: z.string().min(1).max(2000).optional(),
    category: z.enum(["preference", "fact", "instruction", "profile", "other"]).optional(),
    enabled: z.boolean().optional(),
  }),
});

export const memoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Memory ID"),
  }),
});
