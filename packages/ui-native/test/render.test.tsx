import { mock, expect, test } from 'bun:test';
import * as rnw from 'react-native-web';
mock.module('react-native', () => rnw);

const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
const { DSThemeProvider } = await import('../src/theme');
const {
  DSText,
  DSButton,
  DSIconButton,
  DSChip,
  DSAvatar,
  DSListRow,
  DSStatTile,
  DSSegmented,
  DSField,
  DSSearchField,
  DSLargeTitle,
  DSNavBar,
  DSSheetHandle,
  DSSectionHeader,
  DSTabBar,
  DSCard,
  DSEmptyState,
  DSBadge,
  DSInput,
  DSGallery,
  DSToggle,
  DSProgress,
  DSInkCard,
  DSNudge,
} = await import('../src/components');
const {
  DSSnackbarBar,
  DSWeekStrip,
  DSCountPill,
  DSMarkToggle,
  DSSummaryBar,
  DSMultilineField,
} = await import('../src/pattern-components');
const {
  Text,
  Button,
  Card,
  Input,
  Badge,
} = await import('../src/components');

function render(node: React.ReactNode, theme: 'default' = 'default') {
  return renderToString(<DSThemeProvider theme={theme}>{node}</DSThemeProvider>);
}

test('DSText renders all variants with allowFontScaling', () => {
  const html = render(
    <>
      <DSText variant="title">Title Text</DSText>
      <DSText variant="headline">Headline Text</DSText>
      <DSText variant="body">Body Text</DSText>
      <DSText variant="label">Label Text</DSText>
      <DSText variant="caption">Caption Text</DSText>
    </>
  );
  expect(html).toContain('Title Text');
  expect(html).toContain('Headline Text');
  expect(html).toContain('Body Text');
  expect(html).toContain('Label Text');
  expect(html).toContain('Caption Text');
});

test('DSButton renders all variants with button role', () => {
  const html = render(
    <>
      <DSButton variant="primary">Primary</DSButton>
      <DSButton variant="secondary">Secondary</DSButton>
      <DSButton variant="outline">Outline</DSButton>
      <DSButton variant="ghost">Ghost</DSButton>
      <DSButton variant="destructive">Destructive</DSButton>
      <DSButton disabled>Disabled</DSButton>
    </>
  );
  expect(html).toContain('role="button"');
  expect(html).toContain('Primary');
  expect(html).toContain('Secondary');
  expect(html).toContain('Destructive');
});

test('DSIconButton renders with touch target and accessibility label', () => {
  const html = render(<DSIconButton icon="★" accessibilityLabel="Favorite" />);
  expect(html).toContain('role="button"');
  expect(html).toContain('aria-label="Favorite"');
  expect(html).toContain('★');
});

test('DSChip renders all tones with non-colour-only accessibility', () => {
  const html = render(
    <>
      <DSChip tone="neutral">Neutral</DSChip>
      <DSChip tone="accent">Accent</DSChip>
      <DSChip tone="success">Paid</DSChip>
      <DSChip tone="warning">Due</DSChip>
      <DSChip tone="error">Overdue</DSChip>
    </>
  );
  expect(html).toContain('Paid');
  expect(html).toContain('Due');
  expect(html).toContain('Overdue');
  expect(html).toContain('aria-label="success Paid"');
});

test('DSAvatar renders initials with image role', () => {
  const html = render(<DSAvatar initials="AR" accessibilityLabel="Ananya Raghavan" />);
  expect(html).toContain('role="img"');
  expect(html).toContain('AR');
});

test('DSListRow renders leading, title, subtitle, trailing and chevron', () => {
  const html = render(
    <DSListRow
      leading={<DSAvatar initials="AR" />}
      title="Ananya Raghavan"
      subtitle="Class 10 · Maths, Physics"
      trailing={<DSChip tone="success">Paid</DSChip>}
      chevron="›"
      onPress={() => {}}
    />
  );
  expect(html).toContain('Ananya Raghavan');
  expect(html).toContain('Class 10 · Maths, Physics');
  expect(html).toContain('Paid');
  expect(html).toContain('›');
  expect(html).toContain('role="button"');
});

test('DSStatTile renders label, value and tone meta', () => {
  const html = render(
    <DSStatTile label="Collected" value="₹3,84,000" meta="+12% vs Aug" tone="success" />
  );
  expect(html).toContain('Collected');
  expect(html).toContain('₹3,84,000');
  expect(html).toContain('+12% vs Aug');
});

test('DSSegmented renders tabs and tablist role', () => {
  const html = render(
    <DSSegmented items={['All', 'Due', 'Overdue', 'Paid']} selected="Due" />
  );
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).toContain('All');
  expect(html).toContain('Due');
});

test('DSField renders label and text input', () => {
  const html = render(<DSField label="Amount" placeholder="₹12,000" defaultValue="₹12,000" />);
  expect(html).toContain('Amount');
  expect(html).toContain('₹12,000');
});

test('DSSearchField renders search role and placeholder', () => {
  const html = render(<DSSearchField placeholder="Search items" icon="🔍" />);
  expect(html).toContain('role="search"');
  expect(html).toContain('Search items');
  expect(html).toContain('🔍');
});

test('DSLargeTitle renders eyebrow and title with header role', () => {
  const html = render(
    <DSLargeTitle eyebrow="Friday, 19 September" title="Today" trailing={<DSButton size="sm">Action</DSButton>} />
  );
  expect(html).toContain('role="heading"');
  expect(html).toContain('Friday, 19 September');
  expect(html).toContain('Today');
});

test('DSNavBar renders header role with title and actions', () => {
  const html = render(<DSNavBar leading="Back" title="Overview" trailing="More" />);
  expect(html).toContain('role="heading"');
  expect(html).toContain('Overview');
  expect(html).toContain('Back');
  expect(html).toContain('More');
});

test('DSSheetHandle renders grabber', () => {
  const html = render(<DSSheetHandle />);
  expect(html).toContain('aria-label="Sheet handle"');
});

test('DSSectionHeader renders title and action', () => {
  const html = render(<DSSectionHeader title="Classes today" action="See all" onAction={() => {}} />);
  expect(html).toContain('Classes today');
  expect(html).toContain('See all');
});

test('DSTabBar renders floating capsule with tab items', () => {
  const html = render(
    <DSTabBar
      items={[
        { label: 'Today', value: 'today', icon: '📅' },
        { label: 'People', value: 'people', icon: '👥' },
        { label: 'Billing', value: 'billing', icon: '💳' },
      ]}
      selected="today"
    />
  );
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).toContain('Today');
  expect(html).toContain('People');
  expect(html).toContain('Billing');
});

test('DSCard and backwards-compatible primitives render', () => {
  const html = render(
    <Card>
      <Text>Card content</Text>
      <Input placeholder="Enter something" />
      <Badge tone="accent">New</Badge>
      <Button>Click</Button>
    </Card>
  );
  expect(html).toContain('Card content');
  expect(html).toContain('Enter something');
  expect(html).toContain('New');
  expect(html).toContain('Click');
});

test('DSEmptyState renders icon, title, message and action', () => {
  const html = render(
    <DSEmptyState icon="📂" title="No items" message="Add an item to get started." action={<DSButton>Add item</DSButton>} />
  );
  expect(html).toContain('📂');
  expect(html).toContain('No items');
  expect(html).toContain('Add an item to get started.');
  expect(html).toContain('Add item');
});

test('pattern components render with roles and touch-friendly actions', () => {
  const html = render(
    <>
      <DSSnackbarBar message="Item added" actionLabel="Undo" onAction={() => {}} />
      <DSWeekStrip days={[{ id: 'fri', weekdaySymbol: 'F', dayNumber: 19, loadCount: 2 }]} selectedDayId="fri" onSelect={() => {}} />
      <DSCountPill symbol="#" count={42} />
      <DSMarkToggle value={true} onValueChange={() => {}} accessibilityLabel="Mark toggle" />
      <DSSummaryBar items={[{ label: 'Done', value: '7', tone: 'success' }]} />
      <DSMultilineField label="Notes" value="H" onChangeText={() => {}} />
    </>
  );
  expect(html).toContain('Item added');
  expect(html).toContain('Undo');
  expect(html).toContain('role="button"');
  expect(html).toContain('role="switch"');
  expect(html).toContain('7');
  expect(html).toMatch(/1.*500/);
});

test('ink card and toggle components render accessible controls and clamped progress', () => {
  const html = render(<><DSToggle value={true} onValueChange={() => {}} accessibilityLabel="Email alerts on" /><DSToggle value={false} onValueChange={() => {}} accessibilityLabel="Email alerts off" /><DSProgress value={1.5} label="Recent tests" valueLabel="100%" /><DSInkCard><DSText>Next class</DSText></DSInkCard><DSNudge title="Reminder ready" subtitle="Review it" leading={<DSText>Bell</DSText>} onPress={() => {}} /></>);
  expect(html).toContain('role="switch"');
  expect(html).toContain('Email alerts on');
  expect(html).toContain('Email alerts off');
  expect(html).toContain('100%');
  expect(html).toContain('Next class');
  expect(html).toContain('Reminder ready');
});

test('DSGallery renders the default theme in light and dark', () => {
  const html = renderToString(<DSGallery />);
  expect(html).toContain('default (light)');
  expect(html).toContain('default (dark)');

  const onlyDefault = renderToString(<DSGallery theme="default" />);
  expect(onlyDefault).toContain('default (light)');
  expect(onlyDefault).toContain('default (dark)');

  const darkRequested = renderToString(<DSGallery theme="default" mode="dark" />);
  expect(darkRequested).toContain('default (dark)');
});
