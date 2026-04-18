import { logger } from "../../core/logger/logger";
import { NotificationRecord } from "./notifications.types";

export interface PushProvider {
  send(notification: NotificationRecord): Promise<void>;
}

export class MockPushProvider implements PushProvider {
  public async send(notification: NotificationRecord): Promise<void> {
    logger.info("Mock push notification sent", {
      notificationId: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
    });
  }
}
