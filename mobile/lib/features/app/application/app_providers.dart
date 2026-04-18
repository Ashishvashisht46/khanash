import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/app_api_client.dart';
import '../../coach/data/coach_repository.dart';
import '../../home/data/home_repository.dart';
import '../../notifications/data/session_repository.dart';
import '../../onboarding/data/onboarding_repository.dart';
import '../../profile/data/profile_repository.dart';
import '../../progress/data/progress_repository.dart';
import '../../workouts/data/workout_repository.dart';
import 'app_state.dart';
import 'app_state_controller.dart';

final apiClientProvider = Provider<AppApiClient>((ref) => AppApiClient());

final sessionRepositoryProvider = Provider<SessionRepository>(
  (ref) => SessionRepository(ref.watch(apiClientProvider)),
);

final onboardingRepositoryProvider = Provider<OnboardingRepository>(
  (ref) => OnboardingRepository(ref.watch(apiClientProvider)),
);

final homeRepositoryProvider = Provider<HomeRepository>(
  (ref) => HomeRepository(ref.watch(apiClientProvider)),
);

final workoutRepositoryProvider = Provider<WorkoutRepository>(
  (ref) => WorkoutRepository(ref.watch(apiClientProvider)),
);

final progressRepositoryProvider = Provider<ProgressRepository>(
  (ref) => ProgressRepository(ref.watch(apiClientProvider)),
);

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(apiClientProvider)),
);

final coachRepositoryProvider = Provider<CoachRepository>(
  (ref) => CoachRepository(ref.watch(apiClientProvider)),
);

final appStateControllerProvider =
    StateNotifierProvider<AppStateController, AppUiState>((ref) {
  return AppStateController(
    apiClient: ref.watch(apiClientProvider),
    sessionRepository: ref.watch(sessionRepositoryProvider),
    onboardingRepository: ref.watch(onboardingRepositoryProvider),
    homeRepository: ref.watch(homeRepositoryProvider),
    workoutRepository: ref.watch(workoutRepositoryProvider),
    progressRepository: ref.watch(progressRepositoryProvider),
    profileRepository: ref.watch(profileRepositoryProvider),
    coachRepository: ref.watch(coachRepositoryProvider),
  )..bootstrap();
});
