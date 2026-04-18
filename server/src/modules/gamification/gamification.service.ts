import { GamificationRepository } from "./gamification.repository";
import { GamificationSummary } from "./gamification.types";

const calculateLevel = (totalXp: number): { level: number; current: number; target: number } => {
  let level = 1;
  let threshold = 100;
  let remainingXp = totalXp;

  while (remainingXp >= threshold) {
    remainingXp -= threshold;
    level += 1;
    threshold += 25;
  }

  return {
    level,
    current: remainingXp,
    target: threshold,
  };
};

export class GamificationService {
  constructor(private readonly gamificationRepository: GamificationRepository) {}

  public async handleWorkoutCompleted(userId: string, activityDate: string): Promise<void> {
    await this.gamificationRepository.awardWorkoutCompletion(userId, activityDate, 50);
  }

  public async getSummary(userId: string): Promise<GamificationSummary> {
    const summary = await this.gamificationRepository.getSummary(userId);
    const level = calculateLevel(summary.totalXp);

    return {
      totalXp: summary.totalXp,
      currentStreak: summary.streak?.current_streak ?? 0,
      level: level.level,
      progressToNextLevel: {
        current: level.current,
        target: level.target,
      },
      badgesUnlocked: summary.badgeCount,
    };
  }

  public async getBadges(userId: string) {
    return this.gamificationRepository.getBadges(userId);
  }
}
