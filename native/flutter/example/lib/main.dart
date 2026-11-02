import 'package:design_system/design_system.dart';
import 'package:flutter/material.dart';

void main() => runApp(const GalleryApp());

class GalleryApp extends StatefulWidget {
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  ThemeMode _mode = ThemeMode.system;

  @override
  Widget build(BuildContext context) {
    final light = dsThemeData(DSTokens.defaultTheme, brightness: Brightness.light);
    final dark = dsThemeData(DSTokens.defaultTheme, brightness: Brightness.dark);
    return MaterialApp(
      title: 'DS Design Gallery',
      theme: light,
      darkTheme: dark,
      themeMode: _mode,
      home: Scaffold(
        appBar: AppBar(
          title: const Text('DS Design Gallery'),
          actions: [
            IconButton(
              tooltip: 'Switch light/dark theme',
              onPressed: () => setState(
                () => _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
              ),
              icon: Icon(_mode == ThemeMode.dark ? Icons.dark_mode : Icons.light_mode),
            ),
          ],
        ),
        body: const DSGallery(),
      ),
    );
  }
}
