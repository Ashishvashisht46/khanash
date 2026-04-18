import { AppError } from "../../core/errors/app-error";
import { SafeUser } from "../auth/auth.types";
import { UsersRepository } from "./users.repository";
import { CreateOnboardingInput, MeResponse, UpdateProfileInput, UserProfileAggregate } from "./users.types";

const toSafeUser = (user: {
  id: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): SafeUser => ({
  id: user.id,
  email: user.email,
  isActive: user.is_active,
  createdAt: user.created_at.toISOString(),
  updatedAt: user.updated_at.toISOString(),
});

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async getCurrentUser(userId: string): Promise<MeResponse["user"]> {
    const aggregate = await this.usersRepository.findProfileAggregateByUserId(userId);

    if (!aggregate) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    return this.toMeUser(aggregate);
  }

  public async completeOnboarding(userId: string, input: CreateOnboardingInput): Promise<MeResponse["user"]> {
    const existing = await this.usersRepository.findProfileAggregateByUserId(userId);

    if (!existing) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    if (existing.profile?.onboarding_completed_at) {
      throw new AppError("Onboarding has already been completed.", 409, "ONBOARDING_ALREADY_COMPLETED");
    }

    const aggregate = await this.usersRepository.createOnboarding(userId, input);
    return this.toMeUser(aggregate);
  }

  public async updateCurrentUser(userId: string, input: UpdateProfileInput): Promise<MeResponse["user"]> {
    const existing = await this.usersRepository.findProfileAggregateByUserId(userId);

    if (!existing) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    if (!existing.profile?.onboarding_completed_at || !existing.goal) {
      throw new AppError("Complete onboarding before updating your profile.", 403, "ONBOARDING_REQUIRED");
    }

    const updated = await this.usersRepository.updateProfile(userId, input);
    return this.toMeUser(updated);
  }

  private toMeUser(aggregate: UserProfileAggregate): MeResponse["user"] {
    return {
      ...toSafeUser(aggregate.user),
      onboardingComplete: Boolean(aggregate.profile?.onboarding_completed_at && aggregate.goal),
      profile: {
        fitnessGoal: aggregate.goal?.primary_goal ?? null,
        experienceLevel: aggregate.profile?.experience_level ?? null,
        availableEquipment: aggregate.profile?.available_equipment ?? [],
        workoutSchedule: aggregate.profile?.workout_schedule ?? null,
        dietPreference: aggregate.profile?.diet_preference ?? null,
        onboardingCompletedAt: aggregate.profile?.onboarding_completed_at?.toISOString() ?? null,
      },
    };
  }
}
