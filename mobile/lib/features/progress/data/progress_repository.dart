import '../../../core/network/app_api_client.dart';
import '../domain/progress_models.dart';

class ProgressRepository {
  ProgressRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<ProgressView> fetchProgress() async {
    final summary = await _apiClient.get('/gamification/summary');
    final badgesPayload = await _apiClient.get('/gamification/badges');

    return ProgressView(
      totalXp: summary['totalXp'] as int? ?? 0,
      currentStreak: summary['currentStreak'] as int? ?? 0,
      level: summary['level'] as int? ?? 1,
      badges: ((badgesPayload['badges'] as List<dynamic>? ?? const <dynamic>[]) as List)
          .map(
            (badge) => BadgeView(
              name: badge['name'] as String? ?? 'Badge',
              unlocked: badge['unlocked'] as bool? ?? false,
            ),
          )
          .toList(),
    );
  }
}
