import { WorkoutPlanGenerationContext } from "./ai.types";

export const renderWorkoutPrompt = (template: string, context: WorkoutPlanGenerationContext): string =>
  template
    .replace("{{goal}}", context.goal)
    .replace("{{experience}}", context.experienceLevel)
    .replace("{{equipment}}", context.availableEquipment.join(", ") || "bodyweight only")
    .replace("{{days_per_week}}", String(context.workoutSchedule.daysPerWeek))
    .replace("{{preferred_days}}", context.workoutSchedule.preferredDays.join(", "));

export const workoutJsonSchema = {
  name: "weekly_workout_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["plan"],
    properties: {
      plan: {
        type: "array",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["day", "exercises"],
          properties: {
            day: {
              type: "integer",
              minimum: 1,
              maximum: 7,
            },
            exercises: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "sets", "reps"],
                properties: {
                  name: { type: "string" },
                  sets: { type: "integer", minimum: 1, maximum: 8 },
                  reps: { type: "integer", minimum: 1, maximum: 30 },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
