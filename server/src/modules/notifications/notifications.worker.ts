import { env } from "../../config/env";
import { logger } from "../../core/logger/logger";
import { NotificationsService } from "./notifications.service";

export class NotificationsWorker {
  private reminderTimer?: NodeJS.Timeout;
  private summaryTimer?: NodeJS.Timeout;

  constructor(private readonly notificationsService: NotificationsService) {}

  public start(): void {
    if (!env.ENABLE_NOTIFICATION_WORKER) {
      logger.info("Notification worker disabled");
      return;
    }

    this.reminderTimer = setInterval(() => {
      const now = new Date();
      if (now.getUTCHours() >= env.NOTIFICATION_REMINDER_HOUR_UTC) {
        void this.notificationsService.processWorkoutReminders(now);
        void this.notificationsService.processStreakRiskAlerts(now);
      }
    }, 15 * 60 * 1000);

    this.summaryTimer = setInterval(() => {
      const now = new Date();
      const isMonday = now.getUTCDay() === 1;

      if (isMonday && now.getUTCHours() >= env.NOTIFICATION_SUMMARY_HOUR_UTC) {
        void this.notificationsService.processWeeklySummaries(now);
      }
    }, 60 * 60 * 1000);

    logger.info("Notification worker started");
  }

  public stop(): void {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
    }

    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
    }
  }
}
