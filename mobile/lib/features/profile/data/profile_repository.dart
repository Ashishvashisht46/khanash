import '../../../core/network/app_api_client.dart';
import '../domain/profile_models.dart';

class ProfileRepository {
  ProfileRepository(this._apiClient);

  final AppApiClient _apiClient;

  Future<ProfileView> fetchProfile() async {
    final data = await _apiClient.get('/me');
    return ProfileView.fromMePayload(data['user'] as Map<String, dynamic>);
  }
}
