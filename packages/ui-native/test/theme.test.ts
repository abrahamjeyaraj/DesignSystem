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
  test('falls back when fonts are unloaded', () => {
    const theme = createTheme('church', 'light', { fontsLoaded: false });
    expect(theme.fontFamily.heading).toBe(Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }));
    expect(theme.fontFamily.body).toBe(Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }));
  });
});

