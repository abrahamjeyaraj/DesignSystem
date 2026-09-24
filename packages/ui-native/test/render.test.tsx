import { mock, expect, test } from 'bun:test';
import * as rnw from 'react-native-web';
mock.module('react-native', () => rnw);

const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
const { AbeThemeProvider } = await import('../src/theme');
const {
  AbeText,
  AbeButton,
  AbeIconButton,
  AbeChip,
  AbeAvatar,
  AbeListRow,
  AbeStatTile,
  AbeSegmented,
  AbeField,
  AbeSearchField,
  AbeLargeTitle,
  AbeNavBar,
  AbeSheetHandle,
  AbeSectionHeader,
  AbeTabBar,
  AbeCard,
  AbeEmptyState,
  AbeBadge,
  AbeInput,
  AbeGallery,
  Text,
  Button,
  Card,
  Input,
  Badge,
} = await import('../src/components');

function render(node: React.ReactNode, theme: 'tuition' | 'church' | 'bible' = 'tuition') {
  return renderToString(<AbeThemeProvider theme={theme}>{node}</AbeThemeProvider>);
}

test('AbeText renders all variants with allowFontScaling', () => {
  const html = render(
    <>
      <AbeText variant="title">Title Text</AbeText>
      <AbeText variant="headline">Headline Text</AbeText>
      <AbeText variant="body">Body Text</AbeText>
      <AbeText variant="label">Label Text</AbeText>
      <AbeText variant="caption">Caption Text</AbeText>
    </>
  );
  expect(html).toContain('Title Text');
  expect(html).toContain('Headline Text');
  expect(html).toContain('Body Text');
  expect(html).toContain('Label Text');
  expect(html).toContain('Caption Text');
});

test('AbeButton renders all variants with button role', () => {
  const html = render(
    <>
      <AbeButton variant="primary">Primary</AbeButton>
      <AbeButton variant="secondary">Secondary</AbeButton>
      <AbeButton variant="outline">Outline</AbeButton>
      <AbeButton variant="ghost">Ghost</AbeButton>
      <AbeButton variant="destructive">Destructive</AbeButton>
      <AbeButton disabled>Disabled</AbeButton>
    </>
  );
  expect(html).toContain('role="button"');
  expect(html).toContain('Primary');
  expect(html).toContain('Secondary');
  expect(html).toContain('Destructive');
});

test('AbeIconButton renders with touch target and accessibility label', () => {
  const html = render(<AbeIconButton icon="★" accessibilityLabel="Favorite" />);
  expect(html).toContain('role="button"');
  expect(html).toContain('aria-label="Favorite"');
  expect(html).toContain('★');
});

test('AbeChip renders all tones with non-colour-only accessibility', () => {
  const html = render(
    <>
      <AbeChip tone="neutral">Neutral</AbeChip>
      <AbeChip tone="accent">Accent</AbeChip>
      <AbeChip tone="success">Paid</AbeChip>
      <AbeChip tone="warning">Due</AbeChip>
      <AbeChip tone="error">Overdue</AbeChip>
    </>
  );
  expect(html).toContain('Paid');
  expect(html).toContain('Due');
  expect(html).toContain('Overdue');
  expect(html).toContain('aria-label="success Paid"');
});

test('AbeAvatar renders initials with image role', () => {
  const html = render(<AbeAvatar initials="AR" accessibilityLabel="Ananya Raghavan" />);
  expect(html).toContain('role="img"');
  expect(html).toContain('AR');
});

test('AbeListRow renders leading, title, subtitle, trailing and chevron', () => {
  const html = render(
    <AbeListRow
      leading={<AbeAvatar initials="AR" />}
      title="Ananya Raghavan"
      subtitle="Class 10 · Maths, Physics"
      trailing={<AbeChip tone="success">Paid</AbeChip>}
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

test('AbeStatTile renders label, value and tone meta', () => {
  const html = render(
    <AbeStatTile label="Collected" value="₹3,84,000" meta="+12% vs Aug" tone="success" />
  );
  expect(html).toContain('Collected');
  expect(html).toContain('₹3,84,000');
  expect(html).toContain('+12% vs Aug');
});

test('AbeSegmented renders tabs and tablist role', () => {
  const html = render(
    <AbeSegmented items={['All', 'Due', 'Overdue', 'Paid']} selected="Due" />
  );
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).toContain('All');
  expect(html).toContain('Due');
});

test('AbeField renders label and text input', () => {
  const html = render(<AbeField label="Amount" placeholder="₹12,000" defaultValue="₹12,000" />);
  expect(html).toContain('Amount');
  expect(html).toContain('₹12,000');
});

test('AbeSearchField renders search role and placeholder', () => {
  const html = render(<AbeSearchField placeholder="Search students" icon="🔍" />);
  expect(html).toContain('role="search"');
  expect(html).toContain('Search students');
  expect(html).toContain('🔍');
});

test('AbeLargeTitle renders eyebrow and title with header role', () => {
  const html = render(
    <AbeLargeTitle eyebrow="Friday, 19 September" title="Today" trailing={<AbeButton size="sm">Action</AbeButton>} />
  );
  expect(html).toContain('role="heading"');
  expect(html).toContain('Friday, 19 September');
  expect(html).toContain('Today');
});

test('AbeNavBar renders header role with title and actions', () => {
  const html = render(<AbeNavBar leading="Back" title="Student" trailing="More" />);
  expect(html).toContain('role="heading"');
  expect(html).toContain('Student');
  expect(html).toContain('Back');
  expect(html).toContain('More');
});

test('AbeSheetHandle renders grabber', () => {
  const html = render(<AbeSheetHandle />);
  expect(html).toContain('aria-label="Sheet handle"');
});

test('AbeSectionHeader renders title and action', () => {
  const html = render(<AbeSectionHeader title="Classes today" action="See all" onAction={() => {}} />);
  expect(html).toContain('Classes today');
  expect(html).toContain('See all');
});

test('AbeTabBar renders floating capsule with tab items', () => {
  const html = render(
    <AbeTabBar
      items={[
        { label: 'Today', value: 'today', icon: '📅' },
        { label: 'Students', value: 'students', icon: '👥' },
        { label: 'Fees', value: 'fees', icon: '💳' },
      ]}
      selected="today"
    />
  );
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).toContain('Today');
  expect(html).toContain('Students');
  expect(html).toContain('Fees');
});

test('AbeCard and backwards-compatible primitives render', () => {
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

test('AbeEmptyState renders icon, title, message and action', () => {
  const html = render(
    <AbeEmptyState icon="📂" title="No Students" message="Add a student to get started." action={<AbeButton>Add Student</AbeButton>} />
  );
  expect(html).toContain('📂');
  expect(html).toContain('No Students');
  expect(html).toContain('Add a student to get started.');
  expect(html).toContain('Add Student');
});

test('AbeGallery renders all 3 themes and honours supportsDark', () => {
  const html = renderToString(<AbeGallery />);
  expect(html).toContain('tuition (light)');
  expect(html).toContain('Light only - supportsDark: false');
  expect(html).toContain('church (light)');
  expect(html).toContain('church (dark)');
  expect(html).toContain('bible (light)');
  expect(html).toContain('bible (dark)');

  const tuitionOnly = renderToString(<AbeGallery theme="tuition" />);
  expect(tuitionOnly).toContain('tuition (light)');
  expect(tuitionOnly).not.toContain('church');

  const tuitionDarkRequested = renderToString(<AbeGallery theme="tuition" mode="dark" />);
  expect(tuitionDarkRequested).toContain('tuition (light)');
  expect(tuitionDarkRequested).not.toContain('tuition (dark)');
});
