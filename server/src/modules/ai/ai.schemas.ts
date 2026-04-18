import { z } from "zod";

const aiJobParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const getAiJobSchema = z.object({
  body: z.object({}).default({}),
  params: aiJobParamsSchema,
  query: z.object({}).default({}),
});

export const workoutPlanResultSchema = z.object({
  plan: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        exercises: z.array(
          z.object({
            name: z.string().trim().min(1),
            sets: z.number().int().min(1).max(8),
            reps: z.number().int().min(1).max(30),
          }),
        ),
      }),
    )
    .length(7),
});
