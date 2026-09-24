import 'package:design_system/design_system.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  tearDown(DSFonts.clear);

  test(
    'each app keeps its own look and mobile typography comes from mobileType',
    () {
      final church = dsThemeData(
        DSTokens.church,
        brightness: Brightness.light,
      );
      final bible = dsThemeData(DSTokens.bible, brightness: Brightness.dark);
      expect(church.colorScheme.primary, const Color(0xFF1A6B54));
      expect(
        church.extension<DSTheme>()!.extra('verified-blue'),
        const Color(0xFF1D9BF0),
      );
      expect(bible.scaffoldBackgroundColor, const Color(0xFF1A1A12));
      expect(
        church.textTheme.bodyMedium!.fontSize,
        DSTokens.church.mobileType.body.size,
      );
      expect(
        church.textTheme.headlineMedium!.fontSize,
        DSTokens.church.mobileType.headline.size,
      );
      expect(DSTokens.tuition.radius.button, 9999.0);
    },
  );

  test('theme mode ignores dark OS brightness for light-only themes', () {
    expect(
      DSThemeMode.forTheme(DSTokens.tuition, Brightness.dark),
      Brightness.light,
    );
    expect(
      DSThemeMode.forTheme(DSTokens.church, Brightness.dark),
      Brightness.dark,
    );
    final resolved = dsThemeData(
      DSTokens.tuition,
      brightness: Brightness.dark,
    );
    expect(resolved.brightness, Brightness.light);
    expect(
      resolved.scaffoldBackgroundColor,
      Color(DSTokens.tuition.light.background),
    );
    expect(resolved.extension<DSTheme>()!.dark, isFalse);
  });

  test(
    'font families fall back to platform serif and sans until registered',
    () {
      final theme = dsThemeData(DSTokens.bible, brightness: Brightness.light);
      expect(theme.textTheme.bodyMedium!.fontFamily, 'sans-serif');
      expect(theme.textTheme.headlineMedium!.fontFamily, 'serif');
      DSFonts.register('Geist');
      expect(
        dsThemeData(
          DSTokens.bible,
          brightness: Brightness.light,
        ).textTheme.bodyMedium!.fontFamily,
        'Geist',
      );
    },
  );

  testWidgets('DSTheme is available to descendants and uses selected scheme', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: dsThemeData(DSTokens.church, brightness: Brightness.dark),
        home: Builder(
          builder: (context) {
            final theme = DSTheme.of(context);
            return Text(theme.tokens.name);
          },
        ),
      ),
    );
    expect(find.text('church'), findsOneWidget);
    expect(DSTheme.of(tester.element(find.text('church'))).dark, isTrue);
  });
}
