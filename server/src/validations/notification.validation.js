import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const notificationIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    unreadOnly: z.coerce.boolean().optional().default(false),
  }),
});