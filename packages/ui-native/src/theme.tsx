import { type ColorMode, type ColorScheme, type ThemeName, tokens } from '@abrahamjeyaraj/tokens';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { Platform, type TextStyle, useColorScheme, type ViewStyle } from 'react-native';

type ThemeTokens = (typeof tokens.themes)[ThemeName];
type ShadowLayer = { x: number; y: number; blur: number; spread: number; alpha: number };
type FontRole = 'heading' | 'body' | 'label' | 'mono' | 'sans';
type FontsLoaded = boolean | Record<string, boolean> | ((family: string) => boolean);

export interface AbeTextRole { font: string; size: number; lineHeight: number; weight: number; family: string; }
export interface AbeMobileType { title: AbeTextRole; headline: AbeTextRole; body: AbeTextRole; label: AbeTextRole; caption: AbeTextRole; }
export interface AbeMobileLayout { gutter: number; sectionGap: number; itemGap: number; touchTarget: number; controlHeight: number; fieldHeight: number; cardRadius: number; sheetRadius: number; }

export interface AbeTheme {
  name: ThemeName; mode: ColorMode; colors: ColorScheme; extra: Record<string, string>;
  fontFamily: { heading: string; body: string; label: string; mono: string; sans: string };
  fontSize: ThemeTokens['fontSize']; fontWeight: ThemeTokens['fontWeight']; lineHeight: ThemeTokens['lineHeight']; radius: ThemeTokens['radius']; spacing: typeof tokens.spacing; label: ThemeTokens['label'];
  mobileType: AbeMobileType; mobileLayout: AbeMobileLayout; supportsDark: boolean; minTouchTarget: number;
  shadow: (key: keyof ThemeTokens['shadow']) => ViewStyle;
  weight: (w: number) => TextStyle['fontWeight'];
  resolveFont: (role: FontRole, isLoaded?: boolean) => string;
}

const fallback = (role: FontRole) => role === 'heading'
  ? Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })!
  : role === 'mono' ? Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' })!
  : Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' })!;

export function createTheme(name: ThemeName = tokens.defaultTheme, mode: ColorMode = 'light', options?: { fontsLoaded?: FontsLoaded }): AbeTheme {
  const t = tokens.themes[name];
  const resolvedMode: ColorMode = t.supportsDark ? mode : 'light';
  const loaded = (family: string) => {
    const value = options?.fontsLoaded;
    return value === undefined || value === true || (typeof value === 'object' ? value[family] !== false : typeof value === 'function' ? value(family) : false);
  };
  const resolveFont = (role: FontRole, isLoaded = loaded(t.fontFamily[role].family)) => isLoaded ? t.fontFamily[role].family : fallback(role);
  const fontFamily = Object.fromEntries((Object.keys(t.fontFamily) as FontRole[]).map((role) => [role, resolveFont(role)])) as AbeTheme['fontFamily'];
  const mobileType = Object.fromEntries(Object.entries(t.mobile.type).map(([key, value]) => [key, { ...value, family: resolveFont(value.font as FontRole) }])) as AbeMobileType;
  const mobileLayout = t.mobile.layout as AbeMobileLayout;
  return {
    name, mode: resolvedMode, colors: t[resolvedMode], extra: t.extra[resolvedMode], fontFamily,
    fontSize: t.fontSize, fontWeight: t.fontWeight, lineHeight: t.lineHeight, radius: t.radius, spacing: tokens.spacing, label: t.label,
    mobileType, mobileLayout, supportsDark: t.supportsDark, minTouchTarget: mobileLayout.touchTarget,
    shadow: (key) => {
      const layers = t.shadow[key] as readonly ShadowLayer[];
      const layer = layers.reduce((a, b) => b.blur > a.blur ? b : a);
      return { shadowColor: '#000000', shadowOffset: { width: layer.x, height: layer.y }, shadowOpacity: layer.alpha, shadowRadius: layer.blur / 2, elevation: Math.max(1, Math.round(layer.blur / 4)) };
    },
    weight: (w) => String(w) as TextStyle['fontWeight'], resolveFont,
  };
}

const ThemeContext = createContext<AbeTheme>(createTheme());
export interface AbeThemeProviderProps { theme: ThemeName; mode?: ColorMode; fontsLoaded?: FontsLoaded; children: ReactNode; }
export function AbeThemeProvider({ theme, mode, fontsLoaded, children }: AbeThemeProviderProps) {
  const system = useColorScheme();
  const requested = mode ?? (system === 'dark' ? 'dark' : 'light');
  const resolved: ColorMode = tokens.themes[theme].supportsDark ? requested : 'light';
  const value = useMemo(() => createTheme(theme, resolved, { fontsLoaded }), [theme, resolved, fontsLoaded]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useAbeTheme(): AbeTheme { return useContext(ThemeContext); }
