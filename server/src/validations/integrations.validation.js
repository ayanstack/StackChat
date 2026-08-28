import { z } from "zod";

export const connectIntegrationSchema = z.object({
  body: z.object({
    provider: z.enum(["google-drive", "github", "notion", "slack"]),
    authCode: z.string().optional(),
    apiKey: z.string().optional(),
    settings: z.record(z.any()).optional(),
  }),
});

export const integrationProviderParamSchema = z.object({
  params: z.object({
    provider: z.enum(["google-drive", "github", "notion", "slack"]),
  }),
});
