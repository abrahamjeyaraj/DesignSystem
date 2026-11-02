import { describe, expect, test, mock } from 'bun:test';
import * as rnw from 'react-native-web';
mock.module('react-native', () => rnw);

const { Platform } = await import('react-native');
const { createTheme } = await import('../src/theme');

describe('createTheme', () => {
  test('default supports dark mode', () => {
    expect(createTheme('default', 'dark').mode).toBe('dark');
    expect(createTheme('default', 'light').mode).toBe('light');
  });
  test('exposes mobile tokens', () => {
    const theme = createTheme('default');
    expect(theme.mobileType.title.size).toBe(28);
    expect(theme.mobileLayout.touchTarget).toBe(theme.minTouchTarget);
  });
  test('falls back when fonts are unloaded or unbundled by default', () => {
    const unbundled = createTheme('default');
    expect(unbundled.fontFamily.heading).toBe(Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }));
    expect(unbundled.fontFamily.body).toBe(Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }));

    const explicitFalse = createTheme('default', 'light', { fontsLoaded: false });
    expect(explicitFalse.fontFamily.heading).toBe(Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }));
  });
  test('uses theme font when explicitly loaded', () => {
    const loaded = createTheme('default', 'light', { fontsLoaded: true });
    expect(loaded.fontFamily.heading).toBe('Inter');
    expect(loaded.fontFamily.body).toBe('Inter');

    const partial = createTheme('default', 'light', { fontsLoaded: { Inter: true } });
    expect(partial.fontFamily.heading).toBe('Inter');
    expect(partial.fontFamily.body).toBe('Inter');
  });
});
