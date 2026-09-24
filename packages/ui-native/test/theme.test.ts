import { describe, expect, test, mock } from 'bun:test';
import * as rnw from 'react-native-web';
mock.module('react-native', () => rnw);

const { Platform } = await import('react-native');
const { createTheme } = await import('../src/theme');

describe('createTheme', () => {
  test('tuition forces light mode', () => expect(createTheme('tuition', 'dark').mode).toBe('light'));
  test('church and bible support dark mode', () => {
    expect(createTheme('church', 'dark').mode).toBe('dark');
    expect(createTheme('bible', 'dark').mode).toBe('dark');
  });
  test('exposes mobile tokens', () => {
    const theme = createTheme('church');
    expect(theme.mobileType.title.size).toBe(28);
    expect(theme.mobileLayout.touchTarget).toBe(theme.minTouchTarget);
  });
  test('falls back when fonts are unloaded or unbundled by default', () => {
    const unbundled = createTheme('church');
    expect(unbundled.fontFamily.heading).toBe(Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }));
    expect(unbundled.fontFamily.body).toBe(Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }));

    const explicitFalse = createTheme('church', 'light', { fontsLoaded: false });
    expect(explicitFalse.fontFamily.heading).toBe(Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }));
  });
  test('uses theme font when explicitly loaded', () => {
    const loaded = createTheme('church', 'light', { fontsLoaded: true });
    expect(loaded.fontFamily.heading).toBe('Newsreader');
    expect(loaded.fontFamily.body).toBe('Geist');

    const partial = createTheme('tuition', 'light', { fontsLoaded: { Fraunces: true } });
    expect(partial.fontFamily.heading).toBe('Fraunces');
    expect(partial.fontFamily.body).toBe(Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }));
  });
});

