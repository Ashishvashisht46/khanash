import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  body: z
    .object({
      workoutReminders: z.boolean().optional(),
      streakAlerts: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one preference must be provided.",
    }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});
