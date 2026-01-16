// lib/schemas/kycSchema.ts
import { z } from 'zod';

export const kycFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  nationalID: z.string().min(5, "National ID is required"),
});

export type KycFormData = z.infer<typeof kycFormSchema>;