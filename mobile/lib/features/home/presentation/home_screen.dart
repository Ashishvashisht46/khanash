import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../app/application/app_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(appStateControllerProvider).session.home;
    final theme = Theme.of(context);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: ref.read(appStateControllerProvider.notifier).refreshHome,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Text(home.dateLabel, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 6),
            Text('Make today count', style: theme.textTheme.displaySmall),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Streak', style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 8),
                        Text('${home.streak} days', style: theme.textTheme.headlineMedium),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('XP', style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 8),
                        Text('${home.totalXp}', style: theme.textTheme.headlineMedium),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SectionHeader(
                    title: home.workoutTitle,
                    subtitle: '${home.estimatedMinutes} min session',
                  ),
                  const SizedBox(height: 18),
                  ...home.exercises
                      .map(
                        (exercise) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(exercise.name, style: theme.textTheme.titleMedium),
                              ),
                              Text(
                                '${exercise.sets} x ${exercise.reps}',
                                style: theme.textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                  const SizedBox(height: 10),
                  ElevatedButton(
                    onPressed: () => ref.read(appStateControllerProvider.notifier).setTab(1),
                    child: const Text('Start workout'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Coach note'),
                  const SizedBox(height: 14),
                  Text(home.nextCoachLine, style: theme.textTheme.bodyLarge),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
