import { FitnessGoal, WorkoutDay } from "../users/users.types";

export type WorkoutExercise = {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
};

export type WorkoutPlanRecord = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: Date;
  updated_at: Date;
};

export type WorkoutPlanDayRecord = {
  id: string;
  plan_id: string;
  day_number: number;
  exercises: WorkoutExercise[];
  created_at: Date;
  updated_at: Date;
};

export type WorkoutSessionStatus = "completed" | "skipped";

export type WorkoutSessionRecord = {
  id: string;
  user_id: string;
  date: string;
  status: WorkoutSessionStatus;
  plan_id: string | null;
  plan_day_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type WorkoutEntryRecord = {
  id: string;
  session_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: string;
  created_at: Date;
};

export type WorkoutHistoryItem = {
  sessionId: string;
  date: string;
  status: WorkoutSessionStatus;
  planId: string | null;
  entries: WorkoutExercise[];
};

export type TodayWorkoutResponse = {
  planId: string;
  date: string;
  dayNumber: number;
  isRestDay: boolean;
  exercises: WorkoutExercise[];
  session: {
    id: string;
    status: WorkoutSessionStatus;
  } | null;
};

export type CreateWorkoutSessionInput = {
  date?: string;
  status: WorkoutSessionStatus;
  entries: WorkoutExercise[];
};

export type WorkoutTemplateContext = {
  goal: FitnessGoal;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  availableEquipment: string[];
  preferredDays: WorkoutDay[];
};
