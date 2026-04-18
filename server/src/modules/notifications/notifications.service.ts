import { AppError } from "../../core/errors/app-error";
import { MockPushProvider, PushProvider } from "./push.provider";
import {
  NotificationPreferenceInput,
  NotificationType,
} from "./notifications.types";
import { NotificationsRepository } from "./notifications.repository";

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const startOfWeekUtc = (date: Date): Date => {
  const clone = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = clone.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setUTCDate(clone.getUTCDate() + diff);
  return clone;
};

export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly pushProvider: PushProvider = new MockPushProvider(),
  ) {}

  public async listForUser(userId: string) {
    const [notifications, preferences] = await Promise.all([
      this.notificationsRepository.listForUser(userId),
      this.notificationsRepository.getPreferences(userId),
    ]);

    return {
      notifications: notifications.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        isRead: item.is_read,
        createdAt: item.created_at.toISOString(),
      })),
      preferences: {
        workoutReminders: preferences.workout_reminders,
        streakAlerts: preferences.streak_alerts,
        weeklySummary: preferences.weekly_summary,
      },
    };
  }

  public async updatePreferences(userId: string, input: NotificationPreferenceInput) {
    const updated = await this.notificationsRepository.updatePreferences(userId, input);

    return {
      preferences: {
        workoutReminders: updated.workout_reminders,
        streakAlerts: updated.streak_alerts,
        weeklySummary: updated.weekly_summary,
      },
    };
  }

  public async processWorkoutReminders(now = new Date()): Promise<void> {
    const targetDate = toDateOnly(now);
    const candidates = await this.notificationsRepository.listReminderCandidates(targetDate);

    for (const candidate of candidates) {
      const alreadySent = await this.notificationsRepository.hasNotificationForDate(
        candidate.userId,
        "reminder",
        targetDate,
      );

      if (alreadySent) {
        continue;
      }

      await this.dispatch({
        userId: candidate.userId,
        type: "reminder",
        title: "Workout reminder",
        body: "Your workout is still waiting for you today. Even 20 minutes keeps the habit alive.",
      });
    }
  }

  public async processStreakRiskAlerts(now = new Date()): Promise<void> {
    const today = toDateOnly(now);
    const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = toDateOnly(yesterdayDate);
    const candidates = await this.notificationsRepository.listStreakRiskCandidates(today, yesterday);

    for (const candidate of candidates) {
      const alreadySent = await this.notificationsRepository.hasNotificationForDate(
        candidate.userId,
        "streak_alert",
        today,
      );

      if (alreadySent) {
        continue;
      }

      await this.dispatch({
        userId: candidate.userId,
        type: "streak_alert",
        title: "Your streak is at risk",
        body: "You are one missed day away from losing momentum. Finish today’s workout to protect your streak.",
      });
    }
  }

  public async processWeeklySummaries(now = new Date()): Promise<void> {
    const weekStart = startOfWeekUtc(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    const createdDate = toDateOnly(now);
    const candidates = await this.notificationsRepository.listWeeklySummaryCandidates();

    for (const candidate of candidates) {
      const alreadySent = await this.notificationsRepository.hasNotificationForDate(
        candidate.userId,
        "summary",
        createdDate,
      );

      if (alreadySent) {
        continue;
      }

      const stats = await this.notificationsRepository.getWeeklySummaryStats(
        candidate.userId,
        toDateOnly(weekStart),
        toDateOnly(weekEnd),
      );

      if (stats.workoutsCompleted === 0 && stats.xpGained === 0) {
        continue;
      }

      await this.dispatch({
        userId: candidate.userId,
        type: "summary",
        title: "Your weekly summary",
        body: `You completed ${stats.workoutsCompleted} workouts, gained ${stats.xpGained} XP, and ${stats.maintainedStreak ? "kept" : "reset"} your streak this week.`,
      });
    }
  }

  private async dispatch(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
  }): Promise<void> {
    const notification = await this.notificationsRepository.createNotification(input);
    await this.pushProvider.send(notification);
  }
}
