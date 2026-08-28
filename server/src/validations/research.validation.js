import { z } from "zod";

export const researchTopicSchema = z.object({
  body: z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters").max(500, "Topic too long"),
    depth: z.enum(["quick", "standard", "deep"]).optional().default("standard"),
    focusAreas: z.array(z.string()).optional(),
  }),
});
