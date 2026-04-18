import { FitnessGoal, WorkoutDay } from "../users/users.types";

export type AiRequestStatus = "queued" | "processing" | "completed" | "failed";

export type AiWorkoutPlanDay = {
  day: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
  }>;
};

export type AiWorkoutPlanResult = {
  plan: AiWorkoutPlanDay[];
};

export type AiRequestRecord = {
  id: string;
  user_id: string;
  type: "workout_plan";
  status: AiRequestStatus;
  created_at: Date;
};

export type AiJobRecord = {
  id: string;
  request_id: string;
  status: AiRequestStatus;
  result: AiWorkoutPlanResult | { error: string } | null;
  created_at: Date;
};

export type AiCacheRecord = {
  id: string;
  user_id: string;
  hash: string;
  result: AiWorkoutPlanResult;
  created_at: Date;
};

export type PromptVersionRecord = {
  id: string;
  version: string;
  template: string;
  created_at: Date;
};

export type WorkoutPlanGenerationContext = {
  userId: string;
  goal: FitnessGoal;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  availableEquipment: string[];
  workoutSchedule: {
    daysPerWeek: number;
    preferredDays: WorkoutDay[];
  };
};
