// lib/schemas/scheduleSchema.ts
import { z } from 'zod';

export const scheduleSchema = z.object({
  customerId: z.number(),
  scheduledAt: z.date({ message: "Please select a date and time" }),
  // scheduledAt: z.preprocess(
  //   (val) => (val ? new Date(val as string) : undefined),
  //   z.date().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
  //     message: "Please select a date and time",
  //   })
  // ),
});

export type ScheduleData = z.infer<typeof scheduleSchema>;