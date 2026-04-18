class WorkoutExerciseView {
  const WorkoutExerciseView({
    required this.name,
    required this.sets,
    required this.reps,
  });

  final String name;
  final int sets;
  final int reps;
}

class HomeView {
  const HomeView({
    required this.dateLabel,
    required this.streak,
    required this.totalXp,
    required this.workoutTitle,
    required this.estimatedMinutes,
    required this.exercises,
    required this.nextCoachLine,
  });

  final String dateLabel;
  final int streak;
  final int totalXp;
  final String workoutTitle;
  final int estimatedMinutes;
  final List<WorkoutExerciseView> exercises;
  final String nextCoachLine;

  factory HomeView.placeholder() {
    return const HomeView(
      dateLabel: 'Today',
      streak: 4,
      totalXp: 260,
      workoutTitle: 'Upper Body Focus',
      estimatedMinutes: 34,
      exercises: [
        WorkoutExerciseView(name: 'Push-ups', sets: 3, reps: 12),
        WorkoutExerciseView(name: 'Dumbbell Row', sets: 3, reps: 10),
        WorkoutExerciseView(name: 'Shoulder Press', sets: 3, reps: 12),
      ],
      nextCoachLine: 'You have enough momentum for a quick high-quality session.',
    );
  }
}
