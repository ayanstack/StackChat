import { z } from "zod";

export const webSearchQuerySchema = z.object({
  body: z.object({
    query: z.string().min(1, "Query is required").max(500, "Query is too long"),
    maxResults: z.number().int().min(1).max(20).optional().default(5),
    searchDepth: z.enum(["basic", "advanced"]).optional().default("basic"),
    includeAnswer: z.boolean().optional().default(true),
  }),
});
