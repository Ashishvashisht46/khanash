import { SafeUser } from "../auth/auth.types";

export const fitnessGoals = [
  "lose_weight",
  "gain_muscle",
  "maintain_fitness",
  "improve_endurance",
  "increase_strength",
] as const;

export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;

export const dietPreferences = [
  "balanced",
  "high_protein",
  "vegetarian",
  "vegan",
  "keto",
  "paleo",
  "other",
] as const;

export const workoutDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type FitnessGoal = (typeof fitnessGoals)[number];
export type ExperienceLevel = (typeof experienceLevels)[number];
export type DietPreference = (typeof dietPreferences)[number];
export type WorkoutDay = (typeof workoutDays)[number];

export type WorkoutSchedule = {
  daysPerWeek: number;
  preferredDays: WorkoutDay[];
};

export type OnboardingProfileRecord = {
  id: string;
  user_id: string;
  experience_level: ExperienceLevel;
  available_equipment: string[];
  workout_schedule: WorkoutSchedule;
  diet_preference: DietPreference;
  onboarding_completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserGoalRecord = {
  id: string;
  user_id: string;
  primary_goal: FitnessGoal;
  created_at: Date;
  updated_at: Date;
};

export type UserProfileAggregate = {
  user: {
    id: string;
    email: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  };
  profile: OnboardingProfileRecord | null;
  goal: UserGoalRecord | null;
};

export type CreateOnboardingInput = {
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  availableEquipment: string[];
  workoutSchedule: WorkoutSchedule;
  dietPreference: DietPreference;
};

export type UpdateProfileInput = Partial<CreateOnboardingInput>;

export type MeResponse = {
  user: SafeUser & {
    onboardingComplete: boolean;
    profile: {
      fitnessGoal: FitnessGoal | null;
      experienceLevel: ExperienceLevel | null;
      availableEquipment: string[];
      workoutSchedule: WorkoutSchedule | null;
      dietPreference: DietPreference | null;
      onboardingCompletedAt: string | null;
    };
  };
};
