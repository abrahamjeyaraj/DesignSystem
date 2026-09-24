import 'package:abe_design/abe_design.dart';
import 'package:flutter/material.dart';

void main() => runApp(const GalleryApp());

class GalleryApp extends StatefulWidget {
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  AbeThemeTokens _tokens = AbeTokens.tuition;
  ThemeMode _mode = ThemeMode.system;

  @override
  Widget build(BuildContext context) {
    final light = abeThemeData(_tokens, brightness: Brightness.light);
    final dark = abeThemeData(_tokens, brightness: Brightness.dark);
    return MaterialApp(
      title: 'Abe Design Gallery',
      theme: light,
      darkTheme: dark,
      themeMode: _mode,
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Abe Design Gallery'),
          actions: [
            PopupMenuButton<String>(
              tooltip: 'Choose theme',
              onSelected: (name) => setState(
                () => _tokens = switch (name) {
                  'Church' => AbeTokens.church,
                  'Bible' => AbeTokens.bible,
                  _ => AbeTokens.tuition,
                },
              ),
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'Tuition', child: Text('Tuition')),
                PopupMenuItem(value: 'Church', child: Text('Church')),
                PopupMenuItem(value: 'Bible', child: Text('Bible')),
              ],
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Center(child: Text(_tokens.name)),
              ),
            ),
            IconButton(
              tooltip: 'Switch light/dark theme',
              onPressed: () => setState(
                () => _mode = _mode == ThemeMode.dark
                    ? ThemeMode.light
                    : ThemeMode.dark,
              ),
              icon: Icon(
                _mode == ThemeMode.dark ? Icons.dark_mode : Icons.light_mode,
              ),
            ),
          ],
        ),
        body: const AbeGallery(),
      ),
    );
  }
}
