class WorkoutLogLine {
  const WorkoutLogLine({
    required this.exerciseName,
    required this.sets,
    required this.reps,
    required this.weight,
  });

  final String exerciseName;
  final int sets;
  final int reps;
  final double weight;

  Map<String, dynamic> toJson() {
    return {
      'exerciseName': exerciseName,
      'sets': sets,
      'reps': reps,
      'weight': weight,
    };
  }
}
