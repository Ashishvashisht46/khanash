import { z } from "zod";

const workoutEntrySchema = z.object({
  exerciseName: z.string().trim().min(1),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(500),
});

export const createWorkoutSessionSchema = z
  .object({
    body: z
      .object({
        date: z.string().date().optional(),
        status: z.enum(["completed", "skipped"]),
        entries: z.array(workoutEntrySchema).max(30),
      })
      .superRefine((value, ctx) => {
        if (value.status === "completed" && value.entries.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Completed sessions require at least one workout entry.",
            path: ["entries"],
          });
        }

        if (value.status === "skipped" && value.entries.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Skipped sessions cannot contain workout entries.",
            path: ["entries"],
          });
        }
      }),
    params: z.object({}).default({}),
    query: z.object({}).default({}),
  });
