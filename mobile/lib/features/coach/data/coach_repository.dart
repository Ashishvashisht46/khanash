import '../../../core/network/app_api_client.dart';
import '../domain/coach_models.dart';

class CoachRepository {
  CoachRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<CoachView> fetchCoach() async {
    return CoachView.placeholder();
  }

  Future<CoachView> sendPrompt(String prompt) async {
    final response = await _apiClient.post('/ai/workout-plan', data: const <String, dynamic>{});

    final reply = response['source'] == 'cache'
        ? 'I refreshed your plan instantly from your current profile.'
        : 'Your updated plan is being prepared. Check back in a moment.';

    return CoachView(
      messages: [
        CoachMessage(role: 'user', text: prompt),
        CoachMessage(role: 'coach', text: reply),
      ],
    );
  }
}
