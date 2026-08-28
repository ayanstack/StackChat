import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["message", "conversation", "user"]),
    targetId: objectId,
    reason: z.string().trim().min(1, "Reason is required").max(1000),
  }),
});

export const reportIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const resolveReportSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(["reviewed", "resolved", "dismissed"]),
    adminNote: z.string().trim().max(1000).optional(),
  }),
});

export const listReportsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
  }),
});