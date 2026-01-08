// lib/schemas.ts
import { z } from "zod";

// ---  PACKAGE SCHEMA  ---
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

export const packageFormSchema = z.object({
  packageName: z.string().min(3, "Name must be at least 3 characters"),
  packageType: z.string().min(1, "Package Type is required"),
  nationality: z.string().min(1, "Nationality is required"),
  ageCategory: z.string().min(1, "Age Category is required"),
  
  // Dates stored as strings (YYYY-MM-DD) to match your backend DTOs
  effectiveDate: z.string().min(1, "Effective Date is required").refine((date) => {
      return new Date(date) >= yesterday;
  }, "Effective date cannot be in the past"),
  
  lastValidDate: z.string().min(1, "Last Valid Date is required"),
  
  dayPass: z.string().optional(),
  tpremark: z.string().min(1, "Remark is required"), 
  
  // FIX: Allow null initially (for defaultValues), but require non-null for submit
  imageID: z.union([z.instanceof(File), z.string()]).nullable(),
  imageUrl: z.string().optional(),
  
  // Items Array
  packageitems: z.array(z.object({
      attractionId: z.number().optional(),
      itemName: z.string(),
      price: z.number(),
      point: z.number(),
      entryQty: z.number().min(1, "Qty must be at least 1"),
      itemType: z.string().optional(),
      image: z.string().optional()
  })),
  
  totalPrice: z.number().optional(),
}).refine((data) => {
    // Custom cross-field validation
    if (data.effectiveDate && data.lastValidDate) {
        return new Date(data.lastValidDate) >= new Date(data.effectiveDate);
    }
    return true;
}, {
    message: "Expiry date must be after effective date",
    path: ["lastValidDate"]
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

// --- NEW: LOGIN SCHEMA  ---
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>