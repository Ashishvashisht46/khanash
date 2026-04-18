import '../../../core/network/app_api_client.dart';
import '../../app/application/app_state.dart';
import '../../coach/domain/coach_models.dart';
import '../../home/domain/home_models.dart';
import '../../profile/domain/profile_models.dart';
import '../../progress/domain/progress_models.dart';

class SessionRepository {
  SessionRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<SessionState> bootstrapSession() async {
    const accessToken = 'local-dev-token';
    _apiClient.setAccessToken(accessToken);

    try {
      final me = await _apiClient.get('/me');
      final user = me['user'] as Map<String, dynamic>;
      final profile = ProfileView.fromMePayload(user);

      return SessionState(
        hasCompletedOnboarding: profile.onboardingComplete,
        accessToken: accessToken,
        profile: profile,
        home: HomeView.placeholder(),
        progress: ProgressView.placeholder(),
        coach: CoachView.placeholder(),
      );
    } catch (_) {
      return SessionState.initial().copyWith(accessToken: accessToken);
    }
  }
}
