import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../app/application/app_providers.dart';

class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  static const _goals = [
    ('lose_weight', 'Lose Weight'),
    ('gain_muscle', 'Gain Muscle'),
    ('maintain_fitness', 'Stay Consistent'),
    ('improve_endurance', 'Boost Endurance'),
    ('increase_strength', 'Build Strength'),
  ];

  static const _experience = [
    ('beginner', 'Beginner'),
    ('intermediate', 'Intermediate'),
    ('advanced', 'Advanced'),
  ];

  static const _equipment = [
    'Dumbbells',
    'Barbell',
    'Resistance Bands',
    'Bench',
    'Pull-up Bar',
    'Bodyweight Only',
  ];

  static const _weekDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  static const _diets = [
    ('balanced', 'Balanced'),
    ('high_protein', 'High Protein'),
    ('vegetarian', 'Vegetarian'),
    ('vegan', 'Vegan'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(appStateControllerProvider);
    final controller = ref.read(appStateControllerProvider.notifier);
    final draft = state.onboardingDraft;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            const SizedBox(height: 12),
            Text('Build your first week', style: theme.textTheme.displaySmall),
            const SizedBox(height: 10),
            Text(
              'Give us four signals and we will make today feel obvious.',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 28),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Primary goal'),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _goals
                        .map(
                          (goal) => ChoiceChip(
                            label: Text(goal.$2),
                            selected: draft.goal == goal.$1,
                            onSelected: (_) => controller.updateGoal(goal.$1),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Experience level'),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _experience
                        .map(
                          (level) => ChoiceChip(
                            label: Text(level.$2),
                            selected: draft.experienceLevel == level.$1,
                            onSelected: (_) => controller.updateExperience(level.$1),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Equipment you have'),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _equipment
                        .map(
                          (item) => FilterChip(
                            label: Text(item),
                            selected: draft.availableEquipment.contains(item.toLowerCase()),
                            onSelected: (_) => controller.toggleEquipment(item.toLowerCase()),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Weekly rhythm'),
                  const SizedBox(height: 12),
                  Text('${draft.daysPerWeek} workout days', style: theme.textTheme.titleMedium),
                  Slider(
                    value: draft.daysPerWeek.toDouble(),
                    min: 2,
                    max: 6,
                    divisions: 4,
                    label: '${draft.daysPerWeek}',
                    onChanged: (value) => controller.updateDaysPerWeek(value.round()),
                  ),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _weekDays
                        .map(
                          (day) => FilterChip(
                            label: Text(day.substring(0, 3).toUpperCase()),
                            selected: draft.preferredDays.contains(day),
                            onSelected: (_) => controller.togglePreferredDay(day),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Diet preference'),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _diets
                        .map(
                          (diet) => ChoiceChip(
                            label: Text(diet.$2),
                            selected: draft.dietPreference == diet.$1,
                            onSelected: (_) => controller.updateDiet(diet.$1),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: draft.isComplete ? controller.submitOnboarding : null,
              child: const Text('Generate my first week'),
            ),
          ],
        ),
      ),
    );
  }
}
