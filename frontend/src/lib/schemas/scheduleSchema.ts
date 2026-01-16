// lib/schemas/scheduleSchema.ts
import { z } from 'zod';

export const scheduleSchema = z.object({
  customerId: z.number(),
  scheduledAt: z.date({
    required_error: "Please select a date and time",
  }),
});

export type ScheduleData = z.infer<typeof scheduleSchema>;