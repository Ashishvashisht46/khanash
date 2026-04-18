import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../app/application/app_providers.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = ref.watch(appStateControllerProvider).session.progress;
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Text('Progress', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 6),
          Text('Consistency becomes identity', style: theme.textTheme.displaySmall),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Level', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 8),
                      Text('${progress.level}', style: theme.textTheme.headlineMedium),
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
                      Text('Current streak', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 8),
                      Text('${progress.currentStreak} days', style: theme.textTheme.headlineMedium),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(title: 'Badges'),
                const SizedBox(height: 16),
                ...progress.badges.map(
                  (badge) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      badge.unlocked ? Icons.workspace_premium_rounded : Icons.lock_outline_rounded,
                      color: badge.unlocked ? Theme.of(context).colorScheme.primary : Colors.grey,
                    ),
                    title: Text(badge.name),
                    subtitle: Text(badge.unlocked ? 'Unlocked' : 'Keep going'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
