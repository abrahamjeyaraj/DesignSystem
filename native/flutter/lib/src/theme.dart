import 'package:flutter/material.dart';

import 'abe_tokens.g.dart';

/// Families explicitly registered by the host app's pubspec font assets.
///
/// Flutter does not expose its font manifest at runtime. Apps that bundle a
/// token family should register it here; otherwise system serif/sans fallbacks
/// are selected automatically.
abstract final class AbeFonts {
  static final Set<String> registeredFamilies = <String>{};

  static void register(String family) => registeredFamilies.add(family);
  static void unregister(String family) => registeredFamilies.remove(family);
  static void clear() => registeredFamilies.clear();
}

String _font(String family, {required bool serif}) =>
    AbeFonts.registeredFamilies.contains(family)
    ? family
    : (serif ? 'serif' : 'sans-serif');

/// Resolves an OS brightness to a supported theme brightness.
abstract final class AbeThemeMode {
  static Brightness forTheme(
    AbeThemeTokens tokens,
    Brightness platformBrightness,
  ) => tokens.supportsDark ? platformBrightness : Brightness.light;
}

FontWeight _weight(int w) =>
    FontWeight.values[((w / 100).round() - 1).clamp(
      0,
      FontWeight.values.length - 1,
    )];

/// Theme colours + typography exposed as a ThemeExtension for roles Material has no slot for
/// (ink, subtle, line, action, status colours, brand extras).
@immutable
class AbeTheme extends ThemeExtension<AbeTheme> {
  const AbeTheme({
    required this.tokens,
    required this.colors,
    required this.dark,
  });

  final AbeThemeTokens tokens;
  final AbeColorScheme colors;
  final bool dark;

  static AbeTheme of(BuildContext context) =>
      Theme.of(context).extension<AbeTheme>()!;

  Color color(int argb) => Color(argb);
  Color? extra(String name) {
    final v = (dark ? tokens.extraDark : tokens.extraLight)[name];
    return v == null ? null : Color(v);
  }

  String font(String family, {bool serif = false}) =>
      _font(family, serif: serif);

  @override
  AbeTheme copyWith({AbeThemeTokens? tokens, bool? dark}) {
    final t = tokens ?? this.tokens;
    final d = dark ?? this.dark;
    return AbeTheme(
      tokens: t,
      colors: t.colors(dark: d),
      dark: d,
    );
  }

  @override
  AbeTheme lerp(covariant AbeTheme? other, double t) =>
      t < 0.5 ? this : (other ?? this);
}

ThemeData abeThemeData(
  AbeThemeTokens tokens, {
  required Brightness brightness,
}) {
  final resolvedBrightness = AbeThemeMode.forTheme(tokens, brightness);
  final dark = resolvedBrightness == Brightness.dark;
  final c = tokens.colors(dark: dark);
  final label = tokens.label;
  final mobile = tokens.mobileType;
  final labelStyle = TextStyle(
    fontFamily: _font(tokens.fontFamily.label, serif: false),
    fontSize: label.size,
    fontWeight: _weight(label.weight),
    letterSpacing: label.tracking,
  );
  final buttonShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(tokens.radius.button),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: resolvedBrightness,
    fontFamily: _font(tokens.fontFamily.body, serif: false),
    scaffoldBackgroundColor: Color(c.background),
    colorScheme: ColorScheme(
      brightness: resolvedBrightness,
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
      displayLarge: _mobileStyle(mobile.title, c.foreground, serif: true),
      headlineMedium: _mobileStyle(mobile.headline, c.foreground, serif: true),
      titleLarge: _mobileStyle(mobile.headline, c.foreground, serif: true),
      bodyLarge: _mobileStyle(mobile.body, c.inkBody),
      bodyMedium: _mobileStyle(mobile.body, c.foreground),
      bodySmall: _mobileStyle(mobile.caption, c.inkMuted),
      labelMedium: _mobileStyle(mobile.label, c.inkBody),
      labelLarge: labelStyle,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Color(c.action),
        foregroundColor: Color(c.actionForeground),
        minimumSize: Size(0, tokens.mobileLayout.touchTarget),
        shape: buttonShape,
        textStyle: labelStyle,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Color(c.ink),
        side: BorderSide(color: Color(c.line)),
        minimumSize: Size(0, tokens.mobileLayout.touchTarget),
        shape: buttonShape,
        textStyle: labelStyle,
      ),
    ),
    cardTheme: CardThemeData(
      color: Color(c.card),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radius.card),
      ),
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

TextStyle _mobileStyle(AbeTextRole role, int color, {bool serif = false}) =>
    TextStyle(
      fontFamily: _font(role.family, serif: serif),
      fontSize: role.size,
      height: role.lineHeight / role.size,
      fontWeight: _weight(role.weight),
      color: Color(color),
    );
