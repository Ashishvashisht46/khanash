import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/app_api_client.dart';
import '../../coach/data/coach_repository.dart';
import '../../home/data/home_repository.dart';
import '../../notifications/data/session_repository.dart';
import '../../onboarding/data/onboarding_repository.dart';
import '../../profile/data/profile_repository.dart';
import '../../profile/domain/profile_models.dart';
import '../../progress/data/progress_repository.dart';
import '../../workouts/data/workout_repository.dart';
import '../../workouts/domain/workout_models.dart';
import 'app_state.dart';

class AppStateController extends StateNotifier<AppUiState> {
  AppStateController({
    required AppApiClient apiClient,
    required SessionRepository sessionRepository,
    required OnboardingRepository onboardingRepository,
    required HomeRepository homeRepository,
    required WorkoutRepository workoutRepository,
    required ProgressRepository progressRepository,
    required ProfileRepository profileRepository,
    required CoachRepository coachRepository,
  })  : _apiClient = apiClient,
        _sessionRepository = sessionRepository,
        _onboardingRepository = onboardingRepository,
        _homeRepository = homeRepository,
        _workoutRepository = workoutRepository,
        _progressRepository = progressRepository,
        _profileRepository = profileRepository,
        _coachRepository = coachRepository,
        super(AppUiState.initial());

  final AppApiClient _apiClient;
  final SessionRepository _sessionRepository;
  final OnboardingRepository _onboardingRepository;
  final HomeRepository _homeRepository;
  final WorkoutRepository _workoutRepository;
  final ProgressRepository _progressRepository;
  final ProfileRepository _profileRepository;
  final CoachRepository _coachRepository;

  Future<void> bootstrap() async {
    await Future<void>.delayed(const Duration(milliseconds: 450));
    final session = await _sessionRepository.bootstrapSession();
    _apiClient.setAccessToken(session.accessToken);

    state = state.copyWith(
      isBootstrapping: false,
      session: session,
    );
  }

  void updateGoal(String value) {
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(goal: value));
  }

  void updateExperience(String value) {
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(experienceLevel: value));
  }

  void toggleEquipment(String value) {
    final current = [...state.onboardingDraft.availableEquipment];
    if (current.contains(value)) {
      current.remove(value);
    } else {
      current.add(value);
    }
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(availableEquipment: current));
  }

  void updateDaysPerWeek(int value) {
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(daysPerWeek: value));
  }

  void togglePreferredDay(String value) {
    final current = [...state.onboardingDraft.preferredDays];
    if (current.contains(value)) {
      current.remove(value);
    } else {
      current.add(value);
    }
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(preferredDays: current));
  }

  void updateDiet(String value) {
    state = state.copyWith(onboardingDraft: state.onboardingDraft.copyWith(dietPreference: value));
  }

  Future<void> submitOnboarding() async {
    if (!state.onboardingDraft.isComplete) {
      return;
    }

    final profile = await _onboardingRepository.submit(state.onboardingDraft.toRequest());
    await _refreshShell(profileOverride: profile);
  }

  Future<void> refreshHome() async {
    final home = await _homeRepository.fetchHome();
    state = state.copyWith(session: state.session.copyWith(home: home));
  }

  Future<void> completeWorkout(List<WorkoutLogLine> lines) async {
    await _workoutRepository.completeSession(lines);
    await _refreshShell();
  }

  Future<void> askCoach(String prompt) async {
    final coach = await _coachRepository.sendPrompt(prompt);
    state = state.copyWith(session: state.session.copyWith(coach: coach));
  }

  Future<void> refreshProfile() async {
    final profile = await _profileRepository.fetchProfile();
    state = state.copyWith(session: state.session.copyWith(profile: profile));
  }

  void setTab(int index) {
    state = state.copyWith(tabIndex: index);
  }

  Future<void> _refreshShell({ProfileView? profileOverride}) async {
    final profile = profileOverride ?? await _profileRepository.fetchProfile();
    final home = await _homeRepository.fetchHome();
    final progress = await _progressRepository.fetchProgress();
    final coach = await _coachRepository.fetchCoach();

    state = state.copyWith(
      session: state.session.copyWith(
        hasCompletedOnboarding: profile.onboardingComplete,
        profile: profile,
        home: home,
        progress: progress,
        coach: coach,
      ),
      tabIndex: 0,
    );
  }
}
