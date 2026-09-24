import 'package:flutter/material.dart';

import 'abe_tokens.g.dart';

FontWeight _weight(int w) =>
    FontWeight.values[((w / 100).round() - 1).clamp(0, FontWeight.values.length - 1)];

/// Theme colours + typography exposed as a ThemeExtension for roles Material has no slot for
/// (ink, subtle, line, action, status colours, brand extras).
@immutable
class AbeTheme extends ThemeExtension<AbeTheme> {
  const AbeTheme({required this.tokens, required this.colors, required this.dark});

  final AbeThemeTokens tokens;
  final AbeColorScheme colors;
  final bool dark;

  static AbeTheme of(BuildContext context) => Theme.of(context).extension<AbeTheme>()!;

  Color color(int argb) => Color(argb);
  Color? extra(String name) {
    final v = (dark ? tokens.extraDark : tokens.extraLight)[name];
    return v == null ? null : Color(v);
  }

  @override
  AbeTheme copyWith({AbeThemeTokens? tokens, bool? dark}) {
    final t = tokens ?? this.tokens;
    final d = dark ?? this.dark;
    return AbeTheme(tokens: t, colors: t.colors(dark: d), dark: d);
  }

  @override
  AbeTheme lerp(covariant AbeTheme? other, double t) => t < 0.5 ? this : (other ?? this);
}

ThemeData abeThemeData(AbeThemeTokens tokens, {required Brightness brightness}) {
  final dark = brightness == Brightness.dark;
  final c = tokens.colors(dark: dark);
  final label = tokens.label;
  final labelStyle = TextStyle(
    fontFamily: tokens.fontFamily.label,
    fontSize: label.size,
    fontWeight: _weight(label.weight),
    letterSpacing: label.tracking,
  );
  final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radius.button));

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: tokens.fontFamily.body,
    scaffoldBackgroundColor: Color(c.background),
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: Color(c.primary),
      onPrimary: Color(c.primaryForeground),
      secondary: Color(c.accent),
      onSecondary: Color(c.accentForeground),
      error: Color(c.destructive),
      onError: Color(c.destructiveForeground),
      surface: Color(c.card),
      onSurface: Color(c.cardForeground),
      surfaceContainerHighest: Color(c.muted),
      onSurfaceVariant: Color(c.mutedForeground),
      outline: Color(c.border),
    ),
    textTheme: TextTheme(
      headlineMedium: TextStyle(fontFamily: tokens.fontFamily.heading, fontSize: tokens.fontSize.xl2, fontWeight: FontWeight.bold, color: Color(c.foreground)),
      titleLarge: TextStyle(fontFamily: tokens.fontFamily.heading, fontSize: tokens.fontSize.xl, fontWeight: FontWeight.w600, color: Color(c.foreground)),
      bodyMedium: TextStyle(fontSize: tokens.fontSize.base, color: Color(c.foreground)),
      bodySmall: TextStyle(fontSize: tokens.fontSize.sm, color: Color(c.mutedForeground)),
      labelLarge: labelStyle,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Color(c.action),
        foregroundColor: Color(c.actionForeground),
        minimumSize: const Size(0, AbeTokens.minTouchTarget),
        shape: buttonShape,
        textStyle: labelStyle,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Color(c.ink),
        side: BorderSide(color: Color(c.line)),
        minimumSize: const Size(0, AbeTokens.minTouchTarget),
        shape: buttonShape,
        textStyle: labelStyle,
      ),
    ),
    cardTheme: CardThemeData(
      color: Color(c.card),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radius.card)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Color(c.subtle),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(tokens.radius.control),
        borderSide: BorderSide(color: Color(c.line)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(tokens.radius.control),
        borderSide: BorderSide(color: Color(c.line)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(tokens.radius.control),
        borderSide: BorderSide(color: Color(c.ring), width: 2),
      ),
    ),
    extensions: [AbeTheme(tokens: tokens, colors: c, dark: dark)],
  );
}
