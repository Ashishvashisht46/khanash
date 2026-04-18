import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_theme.dart';
import '../features/app/presentation/app_root_view.dart';

class FitnessAiApp extends ConsumerWidget {
  const FitnessAiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Fitness AI',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AppRootView(),
    );
  }
}
