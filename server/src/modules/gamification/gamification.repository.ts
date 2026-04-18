import { PoolClient } from "pg";

import { query, withTransaction } from "../../db/pool";
import {
  BadgeDefinitionRecord,
  BadgeView,
  StreakStateRecord,
  UserBadgeRecord,
  XpLedgerRecord,
} from "./gamification.types";

export class GamificationRepository {
  public async awardWorkoutCompletion(userId: string, activityDate: string, points: number): Promise<boolean> {
    return withTransaction(async (client) => {
      const existingXp = await client.query<{ id: string }>(
        `
          SELECT id
          FROM xp_ledger
          WHERE user_id = $1
            AND action = 'workout_completed'
            AND DATE(created_at) = $2::date
          LIMIT 1
        `,
        [userId, activityDate],
      );

      if (existingXp.rowCount) {
        return false;
      }

      await client.query(
        `
          INSERT INTO xp_ledger (user_id, action, points, created_at)
          VALUES ($1, 'workout_completed', $2, $3::date)
        `,
        [userId, points, activityDate],
      );

      const streak = await this.getStreakStateForUpdate(client, userId);
      const nextStreak = this.calculateNextStreak(streak?.last_activity_date ?? null, streak?.current_streak ?? 0, activityDate);

      if (streak) {
        await client.query(
          `
            UPDATE streak_state
            SET current_streak = $2, last_activity_date = $3
            WHERE user_id = $1
          `,
          [userId, nextStreak, activityDate],
        );
      } else {
        await client.query(
          `
            INSERT INTO streak_state (user_id, current_streak, last_activity_date)
            VALUES ($1, $2, $3)
          `,
          [userId, nextStreak, activityDate],
        );
      }

      await this.unlockEligibleBadges(client, userId, nextStreak);
      return true;
    });
  }

  public async getSummary(userId: string) {
    const [xpResult, streakResult, badgeCountResult] = await Promise.all([
      query<{ total_xp: string }>(
        `
          SELECT COALESCE(SUM(points), 0)::text AS total_xp
          FROM xp_ledger
          WHERE user_id = $1
        `,
        [userId],
      ),
      query<StreakStateRecord>(
        `
          SELECT user_id, current_streak, last_activity_date, updated_at
          FROM streak_state
          WHERE user_id = $1
          LIMIT 1
        `,
        [userId],
      ),
      query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM user_badges
          WHERE user_id = $1
        `,
        [userId],
      ),
    ]);

    return {
      totalXp: Number(xpResult.rows[0]?.total_xp ?? 0),
      streak: streakResult.rows[0] ?? null,
      badgeCount: Number(badgeCountResult.rows[0]?.count ?? 0),
    };
  }

  public async getBadges(userId: string): Promise<BadgeView[]> {
    const result = await query<Record<string, unknown>>(
      `
        SELECT
          bd.id,
          bd.name,
          ub.unlocked_at
        FROM badge_definitions bd
        LEFT JOIN user_badges ub
          ON ub.badge_id = bd.id
         AND ub.user_id = $1
        ORDER BY bd.created_at ASC
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      unlocked: row.unlocked_at !== null,
      unlockedAt: row.unlocked_at ? (row.unlocked_at as Date).toISOString() : null,
    }));
  }

  private async getStreakStateForUpdate(client: PoolClient, userId: string): Promise<StreakStateRecord | null> {
    const result = await client.query<StreakStateRecord>(
      `
        SELECT user_id, current_streak, last_activity_date, updated_at
        FROM streak_state
        WHERE user_id = $1
        FOR UPDATE
      `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  private calculateNextStreak(lastActivityDate: string | null, currentStreak: number, activityDate: string): number {
    if (!lastActivityDate) {
      return 1;
    }

    if (lastActivityDate === activityDate) {
      return currentStreak;
    }

    const previousDate = new Date(`${lastActivityDate}T00:00:00.000Z`);
    previousDate.setUTCDate(previousDate.getUTCDate() + 1);
    const expectedNextDate = previousDate.toISOString().slice(0, 10);

    if (expectedNextDate === activityDate) {
      return currentStreak + 1;
    }

    return 1;
  }

  private async unlockEligibleBadges(client: PoolClient, userId: string, currentStreak: number): Promise<void> {
    const [definitionsResult, workoutsResult, unlockedResult] = await Promise.all([
      client.query<BadgeDefinitionRecord>(
        `
          SELECT id, name, condition, created_at
          FROM badge_definitions
        `,
      ),
      client.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM xp_ledger
          WHERE user_id = $1
            AND action = 'workout_completed'
        `,
        [userId],
      ),
      client.query<UserBadgeRecord>(
        `
          SELECT id, user_id, badge_id, unlocked_at
          FROM user_badges
          WHERE user_id = $1
        `,
        [userId],
      ),
    ]);

    const completedWorkouts = Number(workoutsResult.rows[0]?.count ?? 0);
    const unlockedBadgeIds = new Set(unlockedResult.rows.map((badge) => badge.badge_id));

    for (const definition of definitionsResult.rows) {
      if (unlockedBadgeIds.has(definition.id)) {
        continue;
      }

      const meetsCondition =
        definition.condition.type === "streak"
          ? currentStreak >= definition.condition.target
          : completedWorkouts >= definition.condition.target;

      if (!meetsCondition) {
        continue;
      }

      await client.query(
        `
          INSERT INTO user_badges (user_id, badge_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `,
        [userId, definition.id],
      );
    }
  }
}
