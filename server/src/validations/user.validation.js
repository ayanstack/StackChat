import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(50).optional(),
    }),
})

export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
    }),
})

export const updateSettingsSchema = z.object({
    body : z.object ({
        theme : z.enum(["light", "dark","system"]).optional(),
        language: z.string().optional(),
        defaultModel: z.string().optional(),
        defaultTemperature: z.number().min(0).max(2).optional(),
    }),
})