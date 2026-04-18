import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  const background = Color(0xFFF5F6F0);
  const surface = Color(0xFFFFFFFF);
  const ink = Color(0xFF151716);
  const muted = Color(0xFF66706B);
  const accent = Color(0xFF0E8D72);
  const accentSoft = Color(0xFFDDF6EF);

  final base = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.light(
      primary: accent,
      secondary: Color(0xFF176B5B),
      surface: surface,
      onPrimary: Colors.white,
      onSurface: ink,
      outline: Color(0xFFD7DDD8),
    ),
    textTheme: const TextTheme(
      displaySmall: TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: ink, height: 1.05),
      headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: ink, height: 1.1),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: ink),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: ink),
      bodyLarge: TextStyle(fontSize: 16, color: ink, height: 1.4),
      bodyMedium: TextStyle(fontSize: 14, color: muted, height: 1.4),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
    ),
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: ink,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: const BorderSide(color: Color(0xFFE4E8E4)),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: accentSoft,
      selectedColor: accent,
      labelStyle: const TextStyle(fontWeight: FontWeight.w600),
      secondaryLabelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surface,
      selectedItemColor: accent,
      unselectedItemColor: muted,
      showSelectedLabels: false,
      showUnselectedLabels: false,
      type: BottomNavigationBarType.fixed,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: Color(0xFFE4E8E4)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: Color(0xFFE4E8E4)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: accent, width: 1.4),
      ),
    ),
  );
}
