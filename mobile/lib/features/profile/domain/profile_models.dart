class ProfileView {
  const ProfileView({
    required this.email,
    required this.onboardingComplete,
    required this.goalLabel,
    required this.experienceLabel,
    required this.equipment,
    required this.dietPreference,
  });

  final String email;
  final bool onboardingComplete;
  final String goalLabel;
  final String experienceLabel;
  final List<String> equipment;
  final String dietPreference;

  factory ProfileView.initial() {
    return const ProfileView(
      email: 'ashish@example.com',
      onboardingComplete: false,
      goalLabel: 'Maintain Fitness',
      experienceLabel: 'Beginner',
      equipment: ['Dumbbells'],
      dietPreference: 'Balanced',
    );
  }

  factory ProfileView.fromMePayload(Map<String, dynamic> payload) {
    final profile = (payload['profile'] as Map<String, dynamic>? ?? <String, dynamic>{});

    String humanize(String raw) {
      return raw
          .split('_')
          .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
          .join(' ');
    }

    return ProfileView(
      email: payload['email'] as String? ?? 'user@example.com',
      onboardingComplete: payload['onboardingComplete'] as bool? ?? false,
      goalLabel: humanize(profile['fitnessGoal'] as String? ?? 'maintain_fitness'),
      experienceLabel: humanize(profile['experienceLevel'] as String? ?? 'beginner'),
      equipment: ((profile['availableEquipment'] as List<dynamic>? ?? const <dynamic>[]) as List)
          .map((item) => item.toString())
          .toList(),
      dietPreference: humanize(profile['dietPreference'] as String? ?? 'balanced'),
    );
  }
}
