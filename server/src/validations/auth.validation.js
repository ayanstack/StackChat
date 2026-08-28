import { z } from "zod"

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Name must be at least 2 character").max(50),
        email: z.string().trim().email("Please provide a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    }),
})
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Please provide a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Please provide a valid email"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
});