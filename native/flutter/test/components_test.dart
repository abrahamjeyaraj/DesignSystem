import 'package:design_system/design_system.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _app(Widget child) => MaterialApp(
  theme: dsThemeData(DSTokens.defaultTheme, brightness: Brightness.light),
  home: Scaffold(body: child),
);

void main() {
  testWidgets('every component renders in the gallery', (tester) async {
    tester.view.physicalSize = const Size(390, 4200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(_app(const DSGallery()));
    await tester.pumpAndSettle();
    for (final label in [
      'Buttons',
      'Chips',
      'Profile',
      'Statistics',
      'Filters',
      'Fields',
      'Navigation',
      'Empty state',
    ]) {
      expect(
        find.text(label),
        findsWidgets,
        reason: '$label section should render',
      );
    }
    expect(find.text('Record payment'), findsNothing);
    expect(find.text('Nothing due'), findsOneWidget);
  });

  testWidgets('text, status bar, avatar, sheet handle, and card render', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DSText('Heading', style: DSTextStyle.headline),
            DSStatusBar(time: '9:41'),
            DSAvatar(initials: 'AR'),
            DSSheetHandle(),
            DSCard(child: Text('Card body')),
          ],
        ),
      ),
    );
    expect(find.text('Heading'), findsOneWidget);
    expect(find.text('9:41'), findsOneWidget);
    expect(find.text('AR'), findsOneWidget);
    expect(find.text('Card body'), findsOneWidget);
  });

  testWidgets(
    'button variants and icon button expose labels and meet touch target',
    (tester) async {
      await tester.pumpWidget(
        _app(
          const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DSButton(label: 'Primary action', onPressed: _noop),
              DSButton(
                label: 'Secondary action',
                variant: DSButtonVariant.secondary,
                onPressed: _noop,
              ),
              DSButton(
                label: 'Ghost action',
                variant: DSButtonVariant.ghost,
                onPressed: _noop,
              ),
              DSButton(
                label: 'Remove',
                variant: DSButtonVariant.destructive,
                onPressed: _noop,
              ),
              DSIconButton(
                icon: Icons.add,
                semanticLabel: 'Add record',
                onPressed: _noop,
              ),
            ],
          ),
        ),
      );
      for (final label in [
        'Primary action',
        'Secondary action',
        'Ghost action',
        'Remove',
        'Add record',
      ]) {
        expect(find.bySemanticsLabel(label), findsOneWidget);
      }
      for (final f in [
        find.byType(FilledButton).first,
        find.byType(OutlinedButton),
        find.byType(TextButton).first,
        find.byType(FilledButton).last,
        find.byType(IconButton),
      ]) {
        expect(
          tester.getSize(f).height,
          greaterThanOrEqualTo(DSTokens.defaultTheme.mobileLayout.touchTarget),
        );
      }
    },
  );

  testWidgets(
    'interactive list row, segment control, field, search and tabs work and meet target',
    (tester) async {
      var rowTapped = false, selected = -1, tab = -1;
      await tester.pumpWidget(
        _app(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DSListRow(
                title: 'Item',
                subtitle: 'Class 10',
                onTap: () => rowTapped = true,
              ),
              DSSegmentedControl(
                items: const ['All', 'Due'],
                selected: 0,
                onChanged: (v) => selected = v,
              ),
              const DSField(label: 'Amount', hintText: 'Enter amount'),
              const DSSearchField(hintText: 'Search items'),
              DSTabBar(
                items: const [
                  DSTabItem(label: 'Today', icon: Icons.today),
                  DSTabItem(label: 'Billing', icon: Icons.money),
                ],
                selectedIndex: 0,
                onChanged: (v) => tab = v,
              ),
            ],
          ),
        ),
      );
      expect(find.bySemanticsLabel('Item, Class 10'), findsOneWidget);
      await tester.tap(find.text('Item'));
      await tester.tap(find.text('Due'));
      await tester.tap(find.text('Billing'));
      expect(rowTapped, isTrue);
      expect(selected, 1);
      expect(tab, 1);
      for (final f in [
        find
            .ancestor(of: find.text('Item'), matching: find.byType(InkWell))
            .first,
        find
            .ancestor(of: find.text('All'), matching: find.byType(TextButton))
            .first,
        find
            .ancestor(of: find.text('Due'), matching: find.byType(TextButton))
            .first,
        find.byType(TextFormField),
        find.byType(TextField).first,
        find
            .ancestor(of: find.text('Today'), matching: find.byType(InkWell))
            .last,
        find
            .ancestor(of: find.text('Billing'), matching: find.byType(InkWell))
            .last,
      ]) {
        expect(
          tester.getSize(f).height,
          greaterThanOrEqualTo(DSTokens.defaultTheme.mobileLayout.touchTarget),
          reason: '$f should meet target',
        );
      }
    },
  );

  testWidgets('pattern components meet touch target and expose semantics', (tester) async {
    await tester.pumpWidget(
      _app(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const DSSnackbarBar(message: 'Item added', actionLabel: 'Undo', onAction: _noop),
            DSCountPill(symbol: '#', count: 42, onPressed: _noop),
            DSMarkToggle(marked: true, onChanged: (_) {}, semanticLabel: 'Mark toggle'),
          ],
        ),
      ),
    );
    expect(find.text('Item added'), findsOneWidget);
    expect(find.bySemanticsLabel('Undo'), findsOneWidget);
    expect(find.textContaining('42'), findsWidgets);
    expect(
      tester.getSize(find.bySemanticsLabel('Undo')).height,
      greaterThanOrEqualTo(DSTokens.defaultTheme.mobileLayout.touchTarget),
    );
  });

  testWidgets(
    'chip status has non-colour cue and stat, titles, nav, section, empty state render',
    (tester) async {
      await tester.pumpWidget(
        _app(
          const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DSChip(label: 'Paid', tone: DSChipTone.success),
              DSStatTile(
                label: 'Collected',
                value: '240',
                meta: 'Updated',
                tone: DSStatTone.success,
              ),
              DSLargeTitle(eyebrow: 'Today', title: 'Dashboard'),
              DSNavBar(title: 'Overview'),
              DSSectionHeader(title: 'Classes', actionLabel: 'See all'),
              DSEmptyState(
                icon: Icons.inbox,
                title: 'No results',
                message: 'Try another search.',
              ),
            ],
          ),
        ),
      );
      expect(find.bySemanticsLabel('Paid, success'), findsOneWidget);
      for (final text in [
        'Collected',
        '240',
        'Dashboard',
        'Overview',
        'Classes',
        'See all',
        'No results',
        'Try another search.',
      ])
        expect(find.text(text), findsOneWidget);
    },
  );
}

void _noop() {}
