import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import { logger } from "../../core/logger/logger";
import { WorkoutDay } from "../users/users.types";
import { workoutPlanResultSchema } from "./ai.schemas";
import { renderWorkoutPrompt, workoutJsonSchema } from "./ai.prompt";
import { AiWorkoutPlanResult, PromptVersionRecord, WorkoutPlanGenerationContext } from "./ai.types";

export interface WorkoutPlanProvider {
  generate(context: WorkoutPlanGenerationContext, promptVersion: PromptVersionRecord): Promise<AiWorkoutPlanResult>;
}

const weekdayOrder: WorkoutDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const templatePlan = (context: WorkoutPlanGenerationContext): AiWorkoutPlanResult => {
  const preferredDays = new Set(context.workoutSchedule.preferredDays);
  const baseExercise =
    context.goal === "gain_muscle" || context.goal === "increase_strength"
      ? [
          { name: "Push-ups", sets: 3, reps: context.experienceLevel === "advanced" ? 18 : 12 },
          { name: "Squats", sets: 3, reps: context.experienceLevel === "advanced" ? 15 : 10 },
          { name: "Rows", sets: 3, reps: 12 },
        ]
      : context.goal === "lose_weight"
        ? [
            { name: "Bodyweight Squats", sets: 3, reps: 15 },
            { name: "Mountain Climbers", sets: 3, reps: 20 },
            { name: "Push-ups", sets: 3, reps: 10 },
          ]
        : [
            { name: "Walking Lunges", sets: 3, reps: 12 },
            { name: "Push-ups", sets: 3, reps: 10 },
            { name: "Plank", sets: 3, reps: 45 },
          ];

  return {
    plan: weekdayOrder.map((day, index) => ({
      day: index + 1,
      exercises: preferredDays.has(day) ? baseExercise : [],
    })),
  };
};

export class MockWorkoutPlanProvider implements WorkoutPlanProvider {
  public async generate(context: WorkoutPlanGenerationContext): Promise<AiWorkoutPlanResult> {
    return templatePlan(context);
  }
}

export class OpenAiWorkoutPlanProvider implements WorkoutPlanProvider {
  public async generate(context: WorkoutPlanGenerationContext, promptVersion: PromptVersionRecord): Promise<AiWorkoutPlanResult> {
    if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
      throw new AppError("OpenAI configuration is missing.", 500, "OPENAI_CONFIG_MISSING");
    }

    const prompt = renderWorkoutPrompt(promptVersion.template, context);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        max_completion_tokens: 900,
        messages: [
          {
            role: "system",
            content: "You are a workout planning assistant. Return only valid JSON matching the provided schema.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: workoutJsonSchema,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("OpenAI workout plan generation failed", {
        status: response.status,
        body: text,
      });
      throw new AppError("AI provider request failed.", 502, "AI_PROVIDER_ERROR");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new AppError("AI provider returned an empty response.", 502, "AI_EMPTY_RESPONSE");
    }

    return workoutPlanResultSchema.parse(JSON.parse(rawContent));
  }
}

export const createWorkoutPlanProvider = (): WorkoutPlanProvider => {
  if (env.AI_PROVIDER === "openai") {
    return new OpenAiWorkoutPlanProvider();
  }

  return new MockWorkoutPlanProvider();
};
