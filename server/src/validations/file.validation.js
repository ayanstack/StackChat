import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const fileIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
