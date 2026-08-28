import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Folder name is required").max(100),
    color: z.string().trim().optional(),
  }),
});

export const folderIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const updateFolderSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    color: z.string().trim().optional(),
  }),
});

export const moveConversationSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    folderId: objectId.nullable(),
  }),
});