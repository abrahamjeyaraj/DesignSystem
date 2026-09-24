import 'package:abe_design/abe_design.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _app(Widget child) => MaterialApp(
  theme: abeThemeData(AbeTokens.tuition, brightness: Brightness.light),
  home: Scaffold(body: child),
);

void main() {
  testWidgets('every component renders in the gallery', (tester) async {
    tester.view.physicalSize = const Size(390, 3000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(_app(const AbeGallery()));
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
            AbeText('Heading', style: AbeTextStyle.headline),
            AbeStatusBar(time: '9:41'),
            AbeAvatar(initials: 'AR'),
            AbeSheetHandle(),
            AbeCard(child: Text('Card body')),
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
              AbeButton(label: 'Primary action', onPressed: _noop),
              AbeButton(
                label: 'Secondary action',
                variant: AbeButtonVariant.secondary,
                onPressed: _noop,
              ),
              AbeButton(
                label: 'Ghost action',
                variant: AbeButtonVariant.ghost,
                onPressed: _noop,
              ),
              AbeButton(
                label: 'Remove',
                variant: AbeButtonVariant.destructive,
                onPressed: _noop,
              ),
              AbeIconButton(
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
          greaterThanOrEqualTo(AbeTokens.tuition.mobileLayout.touchTarget),
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
              AbeListRow(
                title: 'Student',
                subtitle: 'Class 10',
                onTap: () => rowTapped = true,
              ),
              AbeSegmentedControl(
                items: const ['All', 'Due'],
                selected: 0,
                onChanged: (v) => selected = v,
              ),
              const AbeField(label: 'Amount', hintText: 'Enter amount'),
              const AbeSearchField(hintText: 'Search students'),
              AbeTabBar(
                items: const [
                  AbeTabItem(label: 'Today', icon: Icons.today),
                  AbeTabItem(label: 'Fees', icon: Icons.money),
                ],
                selectedIndex: 0,
                onChanged: (v) => tab = v,
              ),
            ],
          ),
        ),
      );
      expect(find.bySemanticsLabel('Student, Class 10'), findsOneWidget);
      await tester.tap(find.text('Student'));
      await tester.tap(find.text('Due'));
      await tester.tap(find.text('Fees'));
      expect(rowTapped, isTrue);
      expect(selected, 1);
      expect(tab, 1);
      for (final f in [
        find
            .ancestor(of: find.text('Student'), matching: find.byType(InkWell))
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
            .ancestor(of: find.text('Fees'), matching: find.byType(InkWell))
            .last,
      ]) {
        expect(
          tester.getSize(f).height,
          greaterThanOrEqualTo(AbeTokens.tuition.mobileLayout.touchTarget),
          reason: '$f should meet target',
        );
      }
    },
  );

  testWidgets(
    'chip status has non-colour cue and stat, titles, nav, section, empty state render',
    (tester) async {
      await tester.pumpWidget(
        _app(
          const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AbeChip(label: 'Paid', tone: AbeChipTone.success),
              AbeStatTile(
                label: 'Collected',
                value: '240',
                meta: 'Updated',
                tone: AbeStatTone.success,
              ),
              AbeLargeTitle(eyebrow: 'Today', title: 'Dashboard'),
              AbeNavBar(title: 'Student'),
              AbeSectionHeader(title: 'Classes', actionLabel: 'See all'),
              AbeEmptyState(
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
        'Student',
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
