import { PoolClient } from "pg";

import { query, withTransaction } from "../../db/pool";
import { UserRecord } from "../auth/auth.types";
import {
  CreateOnboardingInput,
  OnboardingProfileRecord,
  UpdateProfileInput,
  UserGoalRecord,
  UserProfileAggregate,
} from "./users.types";

const aggregateSelect = `
  SELECT
    u.id,
    u.email,
    u.is_active,
    u.created_at,
    u.updated_at,
    p.id AS profile_id,
    p.experience_level,
    p.available_equipment,
    p.workout_schedule,
    p.diet_preference,
    p.onboarding_completed_at,
    p.created_at AS profile_created_at,
    p.updated_at AS profile_updated_at,
    g.id AS goal_id,
    g.primary_goal,
    g.created_at AS goal_created_at,
    g.updated_at AS goal_updated_at
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN user_goals g ON g.user_id = u.id
`;

const mapAggregate = (row: Record<string, unknown>): UserProfileAggregate => ({
  user: {
    id: row.id as string,
    email: row.email as string,
    is_active: row.is_active as boolean,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  },
  profile:
    row.profile_id === null
      ? null
      : {
          id: row.profile_id as string,
          user_id: row.id as string,
          experience_level: row.experience_level as OnboardingProfileRecord["experience_level"],
          available_equipment: row.available_equipment as string[],
          workout_schedule: row.workout_schedule as OnboardingProfileRecord["workout_schedule"],
          diet_preference: row.diet_preference as OnboardingProfileRecord["diet_preference"],
          onboarding_completed_at: row.onboarding_completed_at as Date | null,
          created_at: row.profile_created_at as Date,
          updated_at: row.profile_updated_at as Date,
        },
  goal:
    row.goal_id === null
      ? null
      : {
          id: row.goal_id as string,
          user_id: row.id as string,
          primary_goal: row.primary_goal as UserGoalRecord["primary_goal"],
          created_at: row.goal_created_at as Date,
          updated_at: row.goal_updated_at as Date,
        },
});

export class UsersRepository {
  public async findById(userId: string): Promise<UserRecord | null> {
    const result = await query<UserRecord>(
      `
        SELECT id, email, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  public async findProfileAggregateByUserId(userId: string): Promise<UserProfileAggregate | null> {
    const result = await query<Record<string, unknown>>(
      `
        ${aggregateSelect}
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapAggregate(result.rows[0]);
  }

  public async createOnboarding(userId: string, input: CreateOnboardingInput): Promise<UserProfileAggregate> {
    return withTransaction(async (client) => {
      await this.insertProfile(client, userId, input);
      await this.insertGoal(client, userId, input.fitnessGoal);
      const aggregate = await this.findProfileAggregateByUserIdWithClient(client, userId);

      if (!aggregate) {
        throw new Error("Failed to load onboarding profile after creation.");
      }

      return aggregate;
    });
  }

  public async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileAggregate> {
    return withTransaction(async (client) => {
      if (input.experienceLevel || input.availableEquipment || input.workoutSchedule || input.dietPreference) {
        await this.updateProfileRow(client, userId, input);
      }

      if (input.fitnessGoal) {
        await client.query(
          `
            UPDATE user_goals
            SET primary_goal = $2
            WHERE user_id = $1
          `,
          [userId, input.fitnessGoal],
        );
      }

      const aggregate = await this.findProfileAggregateByUserIdWithClient(client, userId);

      if (!aggregate) {
        throw new Error("Failed to load profile after update.");
      }

      return aggregate;
    });
  }

  private async findProfileAggregateByUserIdWithClient(
    client: PoolClient,
    userId: string,
  ): Promise<UserProfileAggregate | null> {
    const result = await client.query<Record<string, unknown>>(
      `
        ${aggregateSelect}
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapAggregate(result.rows[0]);
  }

  private async insertProfile(client: PoolClient, userId: string, input: CreateOnboardingInput): Promise<void> {
    await client.query(
      `
        INSERT INTO profiles (
          user_id,
          experience_level,
          available_equipment,
          workout_schedule,
          diet_preference,
          onboarding_completed_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
      `,
      [
        userId,
        input.experienceLevel,
        input.availableEquipment,
        JSON.stringify(input.workoutSchedule),
        input.dietPreference,
      ],
    );
  }

  private async insertGoal(client: PoolClient, userId: string, fitnessGoal: CreateOnboardingInput["fitnessGoal"]): Promise<void> {
    await client.query(
      `
        INSERT INTO user_goals (user_id, primary_goal)
        VALUES ($1, $2)
      `,
      [userId, fitnessGoal],
    );
  }

  private async updateProfileRow(client: PoolClient, userId: string, input: UpdateProfileInput): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [userId];

    if (input.experienceLevel) {
      values.push(input.experienceLevel);
      fields.push(`experience_level = $${values.length}`);
    }

    if (input.availableEquipment) {
      values.push(input.availableEquipment);
      fields.push(`available_equipment = $${values.length}`);
    }

    if (input.workoutSchedule) {
      values.push(JSON.stringify(input.workoutSchedule));
      fields.push(`workout_schedule = $${values.length}::jsonb`);
    }

    if (input.dietPreference) {
      values.push(input.dietPreference);
      fields.push(`diet_preference = $${values.length}`);
    }

    if (!fields.length) {
      return;
    }

    await client.query(
      `
        UPDATE profiles
        SET ${fields.join(", ")}
        WHERE user_id = $1
      `,
      values,
    );
  }
}
