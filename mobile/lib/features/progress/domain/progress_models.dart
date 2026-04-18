class BadgeView {
  const BadgeView({
    required this.name,
    required this.unlocked,
  });

  final String name;
  final bool unlocked;
}

class ProgressView {
  const ProgressView({
    required this.totalXp,
    required this.currentStreak,
    required this.level,
    required this.badges,
  });

  final int totalXp;
  final int currentStreak;
  final int level;
  final List<BadgeView> badges;

  factory ProgressView.placeholder() {
    return const ProgressView(
      totalXp: 260,
      currentStreak: 4,
      level: 2,
      badges: [
        BadgeView(name: 'First Workout', unlocked: true),
        BadgeView(name: 'Three-Day Streak', unlocked: true),
        BadgeView(name: 'Seven-Day Streak', unlocked: false),
      ],
    );
  }
}
