// lib/schemas.ts
import { z } from "zod";

// --- NEW: LOGIN SCHEMA  ---
export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().trim().min(1, "Password is required"),
  rememberMe: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>