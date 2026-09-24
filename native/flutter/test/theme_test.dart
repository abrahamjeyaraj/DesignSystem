import 'package:abe_design/abe_design.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  tearDown(AbeFonts.clear);

  test(
    'each app keeps its own look and mobile typography comes from mobileType',
    () {
      final church = abeThemeData(
        AbeTokens.church,
        brightness: Brightness.light,
      );
      final bible = abeThemeData(AbeTokens.bible, brightness: Brightness.dark);
      expect(church.colorScheme.primary, const Color(0xFF1A6B54));
      expect(
        church.extension<AbeTheme>()!.extra('verified-blue'),
        const Color(0xFF1D9BF0),
      );
      expect(bible.scaffoldBackgroundColor, const Color(0xFF1A1A12));
      expect(
        church.textTheme.bodyMedium!.fontSize,
        AbeTokens.church.mobileType.body.size,
      );
      expect(
        church.textTheme.headlineMedium!.fontSize,
        AbeTokens.church.mobileType.headline.size,
      );
      expect(AbeTokens.tuition.radius.button, 9999.0);
    },
  );

  test('theme mode ignores dark OS brightness for light-only themes', () {
    expect(
      AbeThemeMode.forTheme(AbeTokens.tuition, Brightness.dark),
      Brightness.light,
    );
    expect(
      AbeThemeMode.forTheme(AbeTokens.church, Brightness.dark),
      Brightness.dark,
    );
    final resolved = abeThemeData(
      AbeTokens.tuition,
      brightness: Brightness.dark,
    );
    expect(resolved.brightness, Brightness.light);
    expect(
      resolved.scaffoldBackgroundColor,
      Color(AbeTokens.tuition.light.background),
    );
    expect(resolved.extension<AbeTheme>()!.dark, isFalse);
  });

  test(
    'font families fall back to platform serif and sans until registered',
    () {
      final theme = abeThemeData(AbeTokens.bible, brightness: Brightness.light);
      expect(theme.textTheme.bodyMedium!.fontFamily, 'sans-serif');
      expect(theme.textTheme.headlineMedium!.fontFamily, 'serif');
      AbeFonts.register('Geist');
      expect(
        abeThemeData(
          AbeTokens.bible,
          brightness: Brightness.light,
        ).textTheme.bodyMedium!.fontFamily,
        'Geist',
      );
    },
  );

  testWidgets('AbeTheme is available to descendants and uses selected scheme', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: abeThemeData(AbeTokens.church, brightness: Brightness.dark),
        home: Builder(
          builder: (context) {
            final theme = AbeTheme.of(context);
            return Text(theme.tokens.name);
          },
        ),
      ),
    );
    expect(find.text('church'), findsOneWidget);
    expect(AbeTheme.of(tester.element(find.text('church'))).dark, isTrue);
  });
}
