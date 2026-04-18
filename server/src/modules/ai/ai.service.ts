import { AppError } from "../../core/errors/app-error";
import { logger } from "../../core/logger/logger";
import { sha256 } from "../../utils/hash";
import { UsersRepository } from "../users/users.repository";
import { WorkoutsRepository } from "../workouts/workouts.repository";
import { createWorkoutPlanProvider, WorkoutPlanProvider } from "./ai.provider";
import { AiRepository } from "./ai.repository";
import { workoutPlanResultSchema } from "./ai.schemas";
import { AiWorkoutPlanResult, WorkoutPlanGenerationContext } from "./ai.types";

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, count: number): Date => {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + count);
  return clone;
};

const buildHash = (context: WorkoutPlanGenerationContext): string =>
  sha256(
    JSON.stringify({
      goal: context.goal,
      experienceLevel: context.experienceLevel,
      availableEquipment: [...context.availableEquipment].sort(),
      daysPerWeek: context.workoutSchedule.daysPerWeek,
      preferredDays: [...context.workoutSchedule.preferredDays].sort(),
    }),
  );

const normalizePlan = (raw: AiWorkoutPlanResult, context: WorkoutPlanGenerationContext): AiWorkoutPlanResult => {
  const validated = workoutPlanResultSchema.parse(raw);
  const preferredDays = new Set(context.workoutSchedule.preferredDays);
  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return {
    plan: validated.plan
      .sort((a, b) => a.day - b.day)
      .map((day, index) => ({
        day: index + 1,
        exercises: preferredDays.has(dayNames[index])
          ? day.exercises.map((exercise) => ({
              name: exercise.name.trim(),
              sets: context.experienceLevel === "beginner" ? Math.min(exercise.sets, 4) : exercise.sets,
              reps: context.experienceLevel === "beginner" ? Math.min(exercise.reps, 15) : exercise.reps,
            }))
          : [],
      })),
  };
};

export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly usersRepository: UsersRepository,
    private readonly workoutsRepository: WorkoutsRepository,
    private readonly provider: WorkoutPlanProvider = createWorkoutPlanProvider(),
  ) {}

  public async requestWorkoutPlan(userId: string) {
    const context = await this.getContext(userId);
    const hash = buildHash(context);
    const cache = await this.aiRepository.findCache(userId, hash);

    if (cache) {
      await this.persistPlan(userId, cache.result);

      return {
        status: "completed" as const,
        source: "cache" as const,
        result: cache.result,
        cachedAt: cache.created_at.toISOString(),
      };
    }

    const created = await this.aiRepository.createWorkoutPlanRequest(userId);

    return {
      status: "queued" as const,
      source: "job" as const,
      requestId: created.request.id,
      jobId: created.job.id,
    };
  }

  public async processWorkoutPlanJob(jobId: string): Promise<void> {
    const job = await this.aiRepository.getJobForProcessing(jobId);

    if (!job || job.status === "completed") {
      return;
    }

    await this.aiRepository.markJobProcessing(jobId);

    try {
      const context = await this.getContext(job.user_id);
      const hash = buildHash(context);
      const cached = await this.aiRepository.findCache(job.user_id, hash);

      if (cached) {
        await this.aiRepository.completeJob(jobId, job.user_id, hash, cached.result);
        await this.persistPlan(job.user_id, cached.result);
        return;
      }

      const promptVersion = await this.aiRepository.getLatestPromptVersion();
      const generated = await this.provider.generate(context, promptVersion);
      const normalized = normalizePlan(generated, context);

      await this.aiRepository.completeJob(jobId, job.user_id, hash, normalized);
      await this.persistPlan(job.user_id, normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI processing error.";
      logger.error("AI workout plan job failed", { jobId, error: message });
      await this.aiRepository.failJob(jobId, message);
    }
  }

  public async getJob(userId: string, jobId: string) {
    const job = await this.aiRepository.getJobForUser(jobId, userId);

    if (!job) {
      throw new AppError("AI job not found.", 404, "AI_JOB_NOT_FOUND");
    }

    return {
      id: job.id,
      status: job.status,
      result: job.result,
      createdAt: job.created_at.toISOString(),
    };
  }

  private async getContext(userId: string): Promise<WorkoutPlanGenerationContext> {
    const aggregate = await this.usersRepository.findProfileAggregateByUserId(userId);

    if (!aggregate?.profile || !aggregate.goal) {
      throw new AppError("Complete onboarding before generating an AI plan.", 403, "ONBOARDING_REQUIRED");
    }

    return {
      userId,
      goal: aggregate.goal.primary_goal,
      experienceLevel: aggregate.profile.experience_level,
      availableEquipment: aggregate.profile.available_equipment,
      workoutSchedule: aggregate.profile.workout_schedule,
    };
  }

  private async persistPlan(userId: string, result: AiWorkoutPlanResult): Promise<void> {
    const startDate = toDateOnly(new Date());
    const endDate = toDateOnly(addDays(new Date(`${startDate}T00:00:00.000Z`), 6));

    await this.workoutsRepository.replaceWeeklyPlan(
      userId,
      startDate,
      endDate,
      result.plan.map((day) => ({
        dayNumber: day.day,
        exercises: day.exercises.map((exercise) => ({
          exerciseName: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: 0,
        })),
      })),
    );
  }
}
