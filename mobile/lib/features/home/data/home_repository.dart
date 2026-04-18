import '../../../core/network/app_api_client.dart';
import '../domain/home_models.dart';

class HomeRepository {
  HomeRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<HomeView> fetchHome() async {
    final workout = await _apiClient.get('/workouts/today');
    final gamification = await _apiClient.get('/gamification/summary');

    final exercises = ((workout['exercises'] as List<dynamic>? ?? const <dynamic>[]) as List)
        .map(
          (item) => WorkoutExerciseView(
            name: item['exerciseName'] as String? ?? item['name'] as String? ?? 'Exercise',
            sets: item['sets'] as int? ?? 3,
            reps: item['reps'] as int? ?? 10,
          ),
        )
        .toList();

    return HomeView(
      dateLabel: workout['date'] as String? ?? 'Today',
      streak: gamification['currentStreak'] as int? ?? 0,
      totalXp: gamification['totalXp'] as int? ?? 0,
      workoutTitle: workout['isRestDay'] == true ? 'Recovery Day' : 'Today\'s Workout',
      estimatedMinutes: 10 + (exercises.length * 8),
      exercises: exercises,
      nextCoachLine: workout['isRestDay'] == true
          ? 'Use today to recover so tomorrow feels sharp.'
          : 'Start with the first movement and let the rest follow.',
    );
  }
}
