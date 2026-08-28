import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().trim().max(150).optional(),
    model: z.string().optional(),
    systemPrompt: z.string().max(4000).optional(),
  }),
});

export const conversationIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const renameConversationSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    title: z.string().trim().min(1, "Title cannot be empty").max(150),
  }),
});

export const listConversationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(["active", "archived", "deleted"]).optional(),
  }),
});