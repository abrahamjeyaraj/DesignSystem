import 'package:abe_design/abe_design.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('each app keeps its own look', () {
    final church = abeThemeData(AbeTokens.church, brightness: Brightness.light);
    final bible = abeThemeData(AbeTokens.bible, brightness: Brightness.dark);
    expect(church.colorScheme.primary, const Color(0xFF1A6B54));
    expect(church.extension<AbeTheme>()!.extra('verified-blue'), const Color(0xFF1D9BF0));
    expect(bible.scaffoldBackgroundColor, const Color(0xFF1A1A12));
    expect(AbeTokens.tuition.radius.button, 9999.0);
  });
}
