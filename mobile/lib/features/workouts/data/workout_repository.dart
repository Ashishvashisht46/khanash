import '../../../core/network/app_api_client.dart';
import '../domain/workout_models.dart';

class WorkoutRepository {
  WorkoutRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<void> completeSession(List<WorkoutLogLine> entries) async {
    await _apiClient.post(
      '/workouts/sessions',
      data: {
        'status': 'completed',
        'entries': entries.map((entry) => entry.toJson()).toList(),
      },
    );
  }
}
