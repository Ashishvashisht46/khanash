export type XpLedgerRecord = {
  id: string;
  user_id: string;
  action: string;
  points: number;
  created_at: Date;
};

export type StreakStateRecord = {
  user_id: string;
  current_streak: number;
  last_activity_date: string | null;
  updated_at: Date;
};

export type BadgeDefinitionRecord = {
  id: string;
  name: string;
  condition: {
    type: "streak" | "workout_count";
    target: number;
  };
  created_at: Date;
};

export type UserBadgeRecord = {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: Date;
};

export type GamificationSummary = {
  totalXp: number;
  currentStreak: number;
  level: number;
  progressToNextLevel: {
    current: number;
    target: number;
  };
  badgesUnlocked: number;
};

export type BadgeView = {
  id: string;
  name: string;
  unlocked: boolean;
  unlockedAt: string | null;
};
