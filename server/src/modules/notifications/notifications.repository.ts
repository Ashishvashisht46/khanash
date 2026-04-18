import { query, withTransaction } from "../../db/pool";
import {
  NotificationPreferenceInput,
  NotificationPreferenceRecord,
  NotificationRecord,
  NotificationSummaryStats,
  NotificationType,
  NotificationUserTarget,
} from "./notifications.types";

const defaultPreferences = `
  INSERT INTO notification_preferences (user_id)
  VALUES ($1)
  ON CONFLICT (user_id) DO NOTHING
`;

export class NotificationsRepository {
  public async listForUser(userId: string): Promise<NotificationRecord[]> {
    const result = await query<NotificationRecord>(
      `
        SELECT id, user_id, type, title, body, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [userId],
    );

    return result.rows;
  }

  public async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    await query(defaultPreferences, [userId]);

    const result = await query<NotificationPreferenceRecord>(
      `
        SELECT user_id, workout_reminders, streak_alerts, weekly_summary, updated_at
        FROM notification_preferences
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    return result.rows[0];
  }

  public async updatePreferences(
    userId: string,
    input: NotificationPreferenceInput,
  ): Promise<NotificationPreferenceRecord> {
    return withTransaction(async (client) => {
      await client.query(defaultPreferences, [userId]);

      const fields: string[] = [];
      const values: unknown[] = [userId];

      if (input.workoutReminders !== undefined) {
        values.push(input.workoutReminders);
        fields.push(`workout_reminders = $${values.length}`);
      }

      if (input.streakAlerts !== undefined) {
        values.push(input.streakAlerts);
        fields.push(`streak_alerts = $${values.length}`);
      }

      if (input.weeklySummary !== undefined) {
        values.push(input.weeklySummary);
        fields.push(`weekly_summary = $${values.length}`);
      }

      await client.query(
        `
          UPDATE notification_preferences
          SET ${fields.join(", ")}
          WHERE user_id = $1
        `,
        values,
      );

      const updated = await client.query<NotificationPreferenceRecord>(
        `
          SELECT user_id, workout_reminders, streak_alerts, weekly_summary, updated_at
          FROM notification_preferences
          WHERE user_id = $1
          LIMIT 1
        `,
        [userId],
      );

      return updated.rows[0];
    });
  }

  public async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<NotificationRecord> {
    const result = await query<NotificationRecord>(
      `
        INSERT INTO notifications (user_id, type, title, body)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, type, title, body, is_read, created_at
      `,
      [input.userId, input.type, input.title, input.body],
    );

    return result.rows[0];
  }

  public async hasNotificationForDate(
    userId: string,
    type: NotificationType,
    date: string,
  ): Promise<boolean> {
    const result = await query<{ id: string }>(
      `
        SELECT id
        FROM notifications
        WHERE user_id = $1
          AND type = $2
          AND DATE(created_at) = $3::date
        LIMIT 1
      `,
      [userId, type, date],
    );

    return Boolean(result.rowCount);
  }

  public async listReminderCandidates(targetDate: string): Promise<NotificationUserTarget[]> {
    const result = await query<NotificationUserTarget>(
      `
        SELECT u.id AS "userId", u.email
        FROM users u
        INNER JOIN profiles p ON p.user_id = u.id
        INNER JOIN user_goals g ON g.user_id = u.id
        LEFT JOIN notification_preferences np ON np.user_id = u.id
        LEFT JOIN workout_sessions ws
          ON ws.user_id = u.id
         AND ws.date = $1::date
         AND ws.status = 'completed'
        WHERE u.is_active = TRUE
          AND p.onboarding_completed_at IS NOT NULL
          AND COALESCE(np.workout_reminders, TRUE) = TRUE
          AND ws.id IS NULL
      `,
      [targetDate],
    );

    return result.rows;
  }

  public async listStreakRiskCandidates(today: string, yesterday: string): Promise<NotificationUserTarget[]> {
    const result = await query<NotificationUserTarget>(
      `
        SELECT u.id AS "userId", u.email
        FROM users u
        INNER JOIN streak_state ss ON ss.user_id = u.id
        LEFT JOIN notification_preferences np ON np.user_id = u.id
        LEFT JOIN workout_sessions ws
          ON ws.user_id = u.id
         AND ws.date = $1::date
         AND ws.status = 'completed'
        WHERE u.is_active = TRUE
          AND ss.current_streak > 0
          AND ss.last_activity_date = $2::date
          AND COALESCE(np.streak_alerts, TRUE) = TRUE
          AND ws.id IS NULL
      `,
      [today, yesterday],
    );

    return result.rows;
  }

  public async listWeeklySummaryCandidates(): Promise<NotificationUserTarget[]> {
    const result = await query<NotificationUserTarget>(
      `
        SELECT u.id AS "userId", u.email
        FROM users u
        INNER JOIN profiles p ON p.user_id = u.id
        LEFT JOIN notification_preferences np ON np.user_id = u.id
        WHERE u.is_active = TRUE
          AND p.onboarding_completed_at IS NOT NULL
          AND COALESCE(np.weekly_summary, TRUE) = TRUE
      `,
    );

    return result.rows;
  }

  public async getWeeklySummaryStats(userId: string, startDate: string, endDate: string): Promise<NotificationSummaryStats> {
    const [workouts, xp, streak] = await Promise.all([
      query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM workout_sessions
          WHERE user_id = $1
            AND status = 'completed'
            AND date BETWEEN $2::date AND $3::date
        `,
        [userId, startDate, endDate],
      ),
      query<{ total: string }>(
        `
          SELECT COALESCE(SUM(points), 0)::text AS total
          FROM xp_ledger
          WHERE user_id = $1
            AND created_at::date BETWEEN $2::date AND $3::date
        `,
        [userId, startDate, endDate],
      ),
      query<{ maintained: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM streak_state
            WHERE user_id = $1
              AND current_streak > 0
          ) AS maintained
        `,
        [userId],
      ),
    ]);

    return {
      workoutsCompleted: Number(workouts.rows[0]?.count ?? 0),
      xpGained: Number(xp.rows[0]?.total ?? 0),
      maintainedStreak: Boolean(streak.rows[0]?.maintained),
    };
  }
}
