import { z } from "zod";

import { dietPreferences, experienceLevels, fitnessGoals, workoutDays } from "./users.types";

const workoutScheduleSchema = z
  .object({
    daysPerWeek: z.number().int().min(1).max(7),
    preferredDays: z.array(z.enum(workoutDays)).min(1).max(7),
  })
  .superRefine((value, ctx) => {
    const uniqueDays = new Set(value.preferredDays);

    if (uniqueDays.size !== value.preferredDays.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred workout days must be unique.",
        path: ["preferredDays"],
      });
    }

    if (value.preferredDays.length < value.daysPerWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred workout days cannot be fewer than days per week.",
        path: ["preferredDays"],
      });
    }
  });

export const onboardingSchema = z.object({
  body: z.object({
    fitnessGoal: z.enum(fitnessGoals),
    experienceLevel: z.enum(experienceLevels),
    availableEquipment: z.array(z.string().trim().min(1)).max(20),
    workoutSchedule: workoutScheduleSchema,
    dietPreference: z.enum(dietPreferences),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const updateMeSchema = z
  .object({
    body: z
      .object({
        fitnessGoal: z.enum(fitnessGoals).optional(),
        experienceLevel: z.enum(experienceLevels).optional(),
        availableEquipment: z.array(z.string().trim().min(1)).max(20).optional(),
        workoutSchedule: workoutScheduleSchema.optional(),
        dietPreference: z.enum(dietPreferences).optional(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field must be provided.",
      }),
    params: z.object({}).default({}),
    query: z.object({}).default({}),
  });
