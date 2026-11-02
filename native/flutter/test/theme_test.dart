import 'package:design_system/design_system.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  tearDown(DSFonts.clear);

  test('default theme exposes mobile typography and extras map', () {
    final theme = dsThemeData(DSTokens.defaultTheme, brightness: Brightness.light);
    expect(theme.colorScheme.primary, const Color(0xFF2563EB));
    expect(
      theme.textTheme.bodyMedium!.fontSize,
      DSTokens.defaultTheme.mobileType.body.size,
    );
    expect(DSTokens.defaultTheme.radius.button, 6.0);
  });

  test('theme mode follows supportsDark', () {
    expect(
      DSThemeMode.forTheme(DSTokens.defaultTheme, Brightness.dark),
      Brightness.dark,
    );
    final resolved = dsThemeData(DSTokens.defaultTheme, brightness: Brightness.dark);
    expect(resolved.brightness, Brightness.dark);
    expect(
      resolved.scaffoldBackgroundColor,
      Color(DSTokens.defaultTheme.dark.background),
    );
  });

  test('font families fall back to platform serif and sans until registered', () {
    final theme = dsThemeData(DSTokens.defaultTheme, brightness: Brightness.light);
    expect(theme.textTheme.bodyMedium!.fontFamily, 'sans-serif');
    expect(theme.textTheme.headlineMedium!.fontFamily, 'serif');
    DSFonts.register('Inter');
    expect(
      dsThemeData(DSTokens.defaultTheme, brightness: Brightness.light).textTheme.bodyMedium!.fontFamily,
      'Inter',
    );
  });

  testWidgets('DSTheme is available to descendants and uses selected scheme', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: dsThemeData(DSTokens.defaultTheme, brightness: Brightness.dark),
        home: Builder(
          builder: (context) {
            final theme = DSTheme.of(context);
            return Text(theme.tokens.name);
          },
        ),
      ),
    );
    expect(find.text('default'), findsOneWidget);
    expect(DSTheme.of(tester.element(find.text('default'))).dark, isTrue);
  });
}
