// lib/schemas/kycSchema.ts
import { z } from 'zod';

export const kycFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  // dateOfBirth: z.preprocess(
  //   (val) => (val ? new Date(val as string) : undefined),
  //   z.date().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
  //     message: "Date of birth is required",
  //   })
  // ),
  nationalID: z.string().min(5, "National ID is required"),
});

export type KycFormData = z.infer<typeof kycFormSchema>;