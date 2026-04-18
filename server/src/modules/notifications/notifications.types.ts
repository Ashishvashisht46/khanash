export type NotificationType = "reminder" | "streak_alert" | "summary";

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: Date;
};

export type NotificationPreferenceRecord = {
  user_id: string;
  workout_reminders: boolean;
  streak_alerts: boolean;
  weekly_summary: boolean;
  updated_at: Date;
};

export type NotificationPreferenceInput = {
  workoutReminders?: boolean;
  streakAlerts?: boolean;
  weeklySummary?: boolean;
};

export type NotificationSummaryStats = {
  workoutsCompleted: number;
  xpGained: number;
  maintainedStreak: boolean;
};

export type NotificationUserTarget = {
  userId: string;
  email: string;
};
