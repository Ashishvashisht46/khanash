import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../app/application/app_providers.dart';
import '../domain/workout_models.dart';

class WorkoutSessionScreen extends ConsumerWidget {
  const WorkoutSessionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(appStateControllerProvider).session.home;
    final controller = ref.read(appStateControllerProvider.notifier);
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Text('Session', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 6),
          Text(home.workoutTitle, style: theme.textTheme.displaySmall),
          const SizedBox(height: 20),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(title: 'Exercise list', subtitle: 'Tap through your main lifts'),
                const SizedBox(height: 18),
                ...home.exercises.asMap().entries.map(
                  (entry) {
                    final index = entry.key;
                    final exercise = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                            foregroundColor: Theme.of(context).colorScheme.primary,
                            child: Text('${index + 1}'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(exercise.name, style: theme.textTheme.titleMedium),
                                const SizedBox(height: 4),
                                Text(
                                  '${exercise.sets} sets | ${exercise.reps} reps',
                                  style: theme.textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                ElevatedButton(
                  onPressed: () async {
                    final lines = home.exercises
                        .map(
                          (exercise) => WorkoutLogLine(
                            exerciseName: exercise.name,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            weight: 0,
                          ),
                        )
                        .toList();

                    await controller.completeWorkout(lines);

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Workout completed and synced')),
                      );
                    }
                  },
                  child: const Text('Finish workout'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
