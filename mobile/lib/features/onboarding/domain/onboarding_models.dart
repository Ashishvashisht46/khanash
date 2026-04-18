class WorkoutScheduleRequest {
  const WorkoutScheduleRequest({
    required this.daysPerWeek,
    required this.preferredDays,
  });

  final int daysPerWeek;
  final List<String> preferredDays;

  Map<String, dynamic> toJson() {
    return {
      'daysPerWeek': daysPerWeek,
      'preferredDays': preferredDays,
    };
  }
}

class OnboardingRequest {
  const OnboardingRequest({
    required this.fitnessGoal,
    required this.experienceLevel,
    required this.availableEquipment,
    required this.workoutSchedule,
    required this.dietPreference,
  });

  final String fitnessGoal;
  final String experienceLevel;
  final List<String> availableEquipment;
  final WorkoutScheduleRequest workoutSchedule;
  final String dietPreference;

  Map<String, dynamic> toJson() {
    return {
      'fitnessGoal': fitnessGoal,
      'experienceLevel': experienceLevel,
      'availableEquipment': availableEquipment,
      'workoutSchedule': workoutSchedule.toJson(),
      'dietPreference': dietPreference,
    };
  }
}
