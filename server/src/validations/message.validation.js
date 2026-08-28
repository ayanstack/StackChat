import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const messageIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    conversationId: objectId,
  }),
  body: z.object({
    content: z.string().trim().min(1, "Message cannot be empty").max(50000),
    attachmentIds: z.array(objectId).max(5, "Maximum 5 attachments allowed").optional().default([]),
  }),
});

export const editMessageSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    content: z.string().trim().min(1, "Message cannot be empty").max(50000),
  }),
});

export const listMessagesSchema = z.object({
  params: z.object({
    conversationId: objectId,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});

export const searchMessagesSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, "Search term is required"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});