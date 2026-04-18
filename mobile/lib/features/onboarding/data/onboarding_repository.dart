import '../../../core/network/app_api_client.dart';
import '../../profile/domain/profile_models.dart';
import '../domain/onboarding_models.dart';

class OnboardingRepository {
  OnboardingRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<ProfileView> submit(OnboardingRequest request) async {
    final data = await _apiClient.post('/onboarding', data: request.toJson());
    return ProfileView.fromMePayload(data['user'] as Map<String, dynamic>);
  }
}
