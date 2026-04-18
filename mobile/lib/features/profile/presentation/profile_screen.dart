import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../app/application/app_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(appStateControllerProvider).session.profile;
    final theme = Theme.of(context);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: ref.read(appStateControllerProvider.notifier).refreshProfile,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Text('Profile', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 6),
            Text('Your fitness identity', style: theme.textTheme.displaySmall),
            const SizedBox(height: 18),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(profile.email, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 6),
                  Text(
                    profile.onboardingComplete ? 'Ready for adaptive coaching' : 'Onboarding incomplete',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Preferences'),
                  const SizedBox(height: 16),
                  _ProfileRow(label: 'Goal', value: profile.goalLabel),
                  _ProfileRow(label: 'Experience', value: profile.experienceLabel),
                  _ProfileRow(label: 'Diet', value: profile.dietPreference),
                  _ProfileRow(label: 'Equipment', value: profile.equipment.join(', ')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
          Expanded(child: Text(value, textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}
