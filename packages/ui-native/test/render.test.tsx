import { mock, expect, test } from 'bun:test';
import * as rnw from 'react-native-web';
mock.module('react-native', () => rnw);
import { renderToString } from 'react-dom/server';
import { AbeThemeProvider } from '../src/theme';
import { AbeText, AbeButton, AbeIconButton, AbeChip, AbeAvatar, AbeListRow, AbeStatTile, AbeSegmented, AbeField, AbeSearchField, AbeLargeTitle, AbeNavBar, AbeSheetHandle, AbeSectionHeader, AbeTabBar, AbeCard, AbeEmptyState, AbeBadge, AbeInput, AbeGallery } from '../src/components';

const render = (node: React.ReactNode) => renderToString(<AbeThemeProvider theme="church">{node}</AbeThemeProvider>);
test('every native component renders on react-native-web', () => {
  const html = render(<><AbeText>Text</AbeText><AbeButton>Button</AbeButton><AbeIconButton icon="i" accessibilityLabel="menu" /><AbeChip>Chip</AbeChip><AbeAvatar initials="AJ" accessibilityLabel="Avatar" /><AbeListRow title="Row" subtitle="Sub" /><AbeStatTile label="Count" value="4" /><AbeSegmented items={[{ label: 'One', value: 'one' }]} selected="one" onChange={() => {}} /><AbeField label="Field" /><AbeSearchField placeholder="Search" /><AbeLargeTitle title="Title" /><AbeNavBar title="Nav" /><AbeSheetHandle /><AbeSectionHeader title="Section" action="More" /><AbeTabBar items={[{ label: 'Home', value: 'home', icon: 'H' }]} selected="home" onChange={() => {}} /><AbeCard>Card</AbeCard><AbeEmptyState title="Empty" message="Nothing here" /><AbeBadge>Badge</AbeBadge><AbeInput placeholder="Input" /><AbeGallery /></>);
  expect(html).toContain('Button');
  expect(html).toContain('menu');
  expect(html).toContain('role="tablist"');
});
