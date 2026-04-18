import '../../coach/domain/coach_models.dart';
import '../../home/domain/home_models.dart';
import '../../onboarding/domain/onboarding_models.dart';
import '../../profile/domain/profile_models.dart';
import '../../progress/domain/progress_models.dart';

class SessionState {
  const SessionState({
    required this.hasCompletedOnboarding,
    required this.accessToken,
    required this.profile,
    required this.home,
    required this.progress,
    required this.coach,
  });

  final bool hasCompletedOnboarding;
  final String? accessToken;
  final ProfileView profile;
  final HomeView home;
  final ProgressView progress;
  final CoachView coach;

  SessionState copyWith({
    bool? hasCompletedOnboarding,
    String? accessToken,
    ProfileView? profile,
    HomeView? home,
    ProgressView? progress,
    CoachView? coach,
  }) {
    return SessionState(
      hasCompletedOnboarding: hasCompletedOnboarding ?? this.hasCompletedOnboarding,
      accessToken: accessToken ?? this.accessToken,
      profile: profile ?? this.profile,
      home: home ?? this.home,
      progress: progress ?? this.progress,
      coach: coach ?? this.coach,
    );
  }

  factory SessionState.initial() {
    return SessionState(
      hasCompletedOnboarding: false,
      accessToken: null,
      profile: ProfileView.initial(),
      home: HomeView.placeholder(),
      progress: ProgressView.placeholder(),
      coach: CoachView.placeholder(),
    );
  }
}

class OnboardingDraft {
  const OnboardingDraft({
    this.goal,
    this.experienceLevel,
    this.availableEquipment = const <String>[],
    this.daysPerWeek = 3,
    this.preferredDays = const <String>['monday', 'wednesday', 'friday'],
    this.dietPreference = 'balanced',
  });

  final String? goal;
  final String? experienceLevel;
  final List<String> availableEquipment;
  final int daysPerWeek;
  final List<String> preferredDays;
  final String dietPreference;

  bool get isComplete => goal != null && experienceLevel != null;

  OnboardingDraft copyWith({
    String? goal,
    String? experienceLevel,
    List<String>? availableEquipment,
    int? daysPerWeek,
    List<String>? preferredDays,
    String? dietPreference,
  }) {
    return OnboardingDraft(
      goal: goal ?? this.goal,
      experienceLevel: experienceLevel ?? this.experienceLevel,
      availableEquipment: availableEquipment ?? this.availableEquipment,
      daysPerWeek: daysPerWeek ?? this.daysPerWeek,
      preferredDays: preferredDays ?? this.preferredDays,
      dietPreference: dietPreference ?? this.dietPreference,
    );
  }

  OnboardingRequest toRequest() {
    return OnboardingRequest(
      fitnessGoal: goal!,
      experienceLevel: experienceLevel!,
      availableEquipment: availableEquipment,
      workoutSchedule: WorkoutScheduleRequest(
        daysPerWeek: daysPerWeek,
        preferredDays: preferredDays,
      ),
      dietPreference: dietPreference,
    );
  }
}

class AppUiState {
  const AppUiState({
    required this.isBootstrapping,
    required this.tabIndex,
    required this.session,
    required this.onboardingDraft,
  });

  final bool isBootstrapping;
  final int tabIndex;
  final SessionState session;
  final OnboardingDraft onboardingDraft;

  AppUiState copyWith({
    bool? isBootstrapping,
    int? tabIndex,
    SessionState? session,
    OnboardingDraft? onboardingDraft,
  }) {
    return AppUiState(
      isBootstrapping: isBootstrapping ?? this.isBootstrapping,
      tabIndex: tabIndex ?? this.tabIndex,
      session: session ?? this.session,
      onboardingDraft: onboardingDraft ?? this.onboardingDraft,
    );
  }

  factory AppUiState.initial() {
    return AppUiState(
      isBootstrapping: true,
      tabIndex: 0,
      session: SessionState.initial(),
      onboardingDraft: const OnboardingDraft(),
    );
  }
}
