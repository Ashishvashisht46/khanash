import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../onboarding/presentation/onboarding_screen.dart';
import '../../shared/presentation/main_shell.dart';
import '../application/app_providers.dart';

class AppRoot extends ConsumerWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appStateControllerProvider);

    if (state.isBootstrapping) {
      return const _BootSplash();
    }

    if (!state.session.hasCompletedOnboarding) {
      return const OnboardingScreen();
    }

    return const MainShell();
  }
}

class _BootSplash extends StatelessWidget {
  const _BootSplash();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 86,
              height: 86,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(28),
              ),
              child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 18),
            Text('Fitness AI', style: theme.textTheme.headlineMedium),
            const SizedBox(height: 10),
            Text('Loading today’s momentum', style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
