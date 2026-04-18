import { AppError } from "../../core/errors/app-error";
import { GamificationService } from "../gamification/gamification.service";
import {
  TodayWorkoutResponse,
  WorkoutExercise,
  WorkoutTemplateContext,
  WorkoutHistoryItem,
  CreateWorkoutSessionInput,
} from "./workouts.types";
import { WorkoutsRepository } from "./workouts.repository";

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const addDays = (date: Date, days: number): Date => {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
};

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const differenceInDays = (start: string, end: string): number => {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / 86_400_000);
};

const pickStrengthTemplate = (equipment: string[], isUpper: boolean): WorkoutExercise[] => {
  const hasDumbbells = equipment.includes("dumbbells");
  const hasBarbell = equipment.includes("barbell");
  const hasBands = equipment.includes("resistance bands");

  if (isUpper) {
    return [
      { exerciseName: hasBarbell ? "Bench Press" : hasDumbbells ? "Dumbbell Press" : "Push Ups", sets: 4, reps: 10, weight: 0 },
      { exerciseName: hasDumbbells ? "One-Arm Dumbbell Row" : hasBands ? "Band Row" : "Bodyweight Row", sets: 4, reps: 10, weight: 0 },
      { exerciseName: hasDumbbells ? "Dumbbell Shoulder Press" : "Pike Push Up", sets: 3, reps: 12, weight: 0 },
      { exerciseName: "Plank", sets: 3, reps: 45, weight: 0 },
    ];
  }

  return [
    { exerciseName: hasBarbell ? "Back Squat" : hasDumbbells ? "Goblet Squat" : "Air Squat", sets: 4, reps: 10, weight: 0 },
    { exerciseName: hasDumbbells ? "Romanian Deadlift" : "Hip Hinge", sets: 4, reps: 10, weight: 0 },
    { exerciseName: "Walking Lunge", sets: 3, reps: 12, weight: 0 },
    { exerciseName: "Glute Bridge", sets: 3, reps: 15, weight: 0 },
  ];
};

const pickFatLossTemplate = (equipment: string[]): WorkoutExercise[] => {
  const hasBike = equipment.includes("bike");
  return [
    { exerciseName: "Bodyweight Squat", sets: 4, reps: 15, weight: 0 },
    { exerciseName: "Push Ups", sets: 4, reps: 10, weight: 0 },
    { exerciseName: "Mountain Climbers", sets: 4, reps: 20, weight: 0 },
    { exerciseName: hasBike ? "Bike Sprint" : "Jumping Jacks", sets: 6, reps: 30, weight: 0 },
  ];
};

const pickEnduranceTemplate = (equipment: string[]): WorkoutExercise[] => {
  const hasTreadmill = equipment.includes("treadmill");
  return [
    { exerciseName: hasTreadmill ? "Treadmill Intervals" : "Jog Intervals", sets: 5, reps: 5, weight: 0 },
    { exerciseName: "Walking Lunge", sets: 3, reps: 16, weight: 0 },
    { exerciseName: "Step Ups", sets: 3, reps: 14, weight: 0 },
    { exerciseName: "Plank", sets: 3, reps: 60, weight: 0 },
  ];
};

const scaleForExperience = (
  exercises: WorkoutExercise[],
  experienceLevel: WorkoutTemplateContext["experienceLevel"],
): WorkoutExercise[] => {
  const modifier = experienceLevel === "advanced" ? 2 : experienceLevel === "intermediate" ? 1 : 0;

  return exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets + modifier,
    reps: typeof exercise.reps === "number" ? exercise.reps : exercise.reps,
  }));
};

const buildExercisesForGoal = (context: WorkoutTemplateContext, dayIndex: number): WorkoutExercise[] => {
  switch (context.goal) {
    case "gain_muscle":
      return scaleForExperience(pickStrengthTemplate(context.availableEquipment, dayIndex % 2 === 0), context.experienceLevel);
    case "increase_strength":
      return scaleForExperience(pickStrengthTemplate(context.availableEquipment, dayIndex % 2 === 0), context.experienceLevel);
    case "improve_endurance":
      return scaleForExperience(pickEnduranceTemplate(context.availableEquipment), context.experienceLevel);
    case "lose_weight":
      return scaleForExperience(pickFatLossTemplate(context.availableEquipment), context.experienceLevel);
    case "maintain_fitness":
    default:
      return scaleForExperience(
        [
          { exerciseName: "Bodyweight Squat", sets: 3, reps: 12, weight: 0 },
          { exerciseName: "Push Ups", sets: 3, reps: 10, weight: 0 },
          { exerciseName: "Bent Over Row", sets: 3, reps: 12, weight: 0 },
          { exerciseName: "Dead Bug", sets: 3, reps: 12, weight: 0 },
        ],
        context.experienceLevel,
      );
  }
};

export class WorkoutsService {
  constructor(
    private readonly workoutsRepository: WorkoutsRepository,
    private readonly gamificationService: GamificationService,
  ) {}

  public async getTodayWorkout(userId: string): Promise<TodayWorkoutResponse> {
    const today = toDateOnly(new Date());
    const activePlan = await this.ensureActivePlan(userId, today);
    const dayNumber = differenceInDays(activePlan.plan.start_date, today) + 1;
    const planDay = activePlan.days.find((day) => day.day_number === dayNumber);

    if (!planDay) {
      throw new AppError("Workout day not found for today's plan.", 500, "WORKOUT_PLAN_DAY_MISSING");
    }

    const session = await this.workoutsRepository.findSessionByUserAndDate(userId, today);

    return {
      planId: activePlan.plan.id,
      date: today,
      dayNumber,
      isRestDay: planDay.exercises.length === 0,
      exercises: planDay.exercises,
      session: session
        ? {
            id: session.id,
            status: session.status,
          }
        : null,
    };
  }

  public async createSession(userId: string, input: CreateWorkoutSessionInput) {
    const sessionDate = input.date ?? toDateOnly(new Date());
    const activePlan = await this.ensureActivePlan(userId, sessionDate);
    const dayNumber = differenceInDays(activePlan.plan.start_date, sessionDate) + 1;
    const planDay = activePlan.days.find((day) => day.day_number === dayNumber) ?? null;

    if (!planDay) {
      throw new AppError("No workout plan day found for this session date.", 400, "PLAN_DAY_NOT_FOUND");
    }

    const existingSession = await this.workoutsRepository.findSessionByUserAndDate(userId, sessionDate);

    const session = await this.workoutsRepository.createOrReplaceSession(userId, {
      ...input,
      date: sessionDate,
      planId: activePlan.plan.id,
      planDayId: planDay.id,
    });

    if (input.status === "completed" && existingSession?.status !== "completed") {
      await this.gamificationService.handleWorkoutCompleted(userId, sessionDate);
    }

    return {
      sessionId: session.id,
      date: session.date,
      status: session.status,
      entries: input.entries,
    };
  }

  public async getHistory(userId: string): Promise<{ history: WorkoutHistoryItem[] }> {
    const history = await this.workoutsRepository.getHistory(userId);
    return { history };
  }

  private async ensureActivePlan(userId: string, targetDate: string) {
    const existing = await this.workoutsRepository.findActivePlanForDate(userId, targetDate);

    if (existing) {
      return existing;
    }

    const profile = await this.workoutsRepository.getProfileForPlanGeneration(userId);

    if (!profile?.profile || !profile.goal) {
      throw new AppError("Complete onboarding before accessing workouts.", 403, "ONBOARDING_REQUIRED");
    }

    const userProfile = profile.profile;
    const userGoal = profile.goal;

    const startDate = targetDate;
    const endDate = toDateOnly(addDays(new Date(`${targetDate}T00:00:00.000Z`), 6));
    const days = Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(new Date(`${startDate}T00:00:00.000Z`), index);
      const dayName = dayNames[currentDate.getUTCDay()];
      const isWorkoutDay = userProfile.workout_schedule.preferredDays.includes(dayName);

      return {
        dayNumber: index + 1,
        exercises: isWorkoutDay
          ? buildExercisesForGoal(
              {
                goal: userGoal.primary_goal,
                experienceLevel: userProfile.experience_level,
                availableEquipment: userProfile.available_equipment.map((item) => item.toLowerCase()),
                preferredDays: userProfile.workout_schedule.preferredDays,
              },
              index,
            )
          : [],
      };
    });

    return this.workoutsRepository.createWeeklyPlan(userId, startDate, endDate, days);
  }
}
