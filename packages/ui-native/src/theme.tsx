import { type ColorMode, type ColorScheme, type ThemeName, tokens } from '@abe/tokens';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type TextStyle, useColorScheme, type ViewStyle } from 'react-native';

type ThemeTokens = (typeof tokens.themes)[ThemeName];
type ShadowLayer = { x: number; y: number; blur: number; spread: number; alpha: number };

export interface AbeTheme {
  name: ThemeName;
  mode: ColorMode;
  colors: ColorScheme;
  /** Brand-only colours outside the shared role contract, e.g. church "verified-blue". */
  extra: Record<string, string>;
  fontFamily: { [K in keyof ThemeTokens['fontFamily']]: string };
  fontSize: ThemeTokens['fontSize'];
  fontWeight: ThemeTokens['fontWeight'];
  lineHeight: ThemeTokens['lineHeight'];
  radius: ThemeTokens['radius'];
  spacing: typeof tokens.spacing;
  label: ThemeTokens['label'];
  minTouchTarget: number;
  /** RN shadow props (iOS) + elevation (Android) from a theme shadow key. */
  shadow: (key: keyof ThemeTokens['shadow']) => ViewStyle;
  /** Font weight as the string React Native expects. */
  weight: (w: number) => TextStyle['fontWeight'];
}

export function createTheme(name: ThemeName = tokens.defaultTheme, mode: ColorMode = 'light'): AbeTheme {
  const t = tokens.themes[name];
  const fontFamily = Object.fromEntries(
    Object.entries(t.fontFamily).map(([k, f]) => [k, f.family]),
  ) as AbeTheme['fontFamily'];
  return {
    name,
    mode,
    colors: t[mode],
    extra: t.extra[mode],
    fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    lineHeight: t.lineHeight,
    radius: t.radius,
    spacing: tokens.spacing,
    label: t.label,
    minTouchTarget: tokens.minTouchTarget,
    shadow: (key) => {
      const layers = t.shadow[key] as readonly ShadowLayer[];
      // RN supports one layer; use the widest one.
      const l = layers.reduce((a, b) => (b.blur > a.blur ? b : a));
      return {
        shadowColor: '#000000',
        shadowOffset: { width: l.x, height: l.y },
        shadowOpacity: l.alpha,
        shadowRadius: l.blur / 2,
        elevation: Math.max(1, Math.round(l.blur / 4)),
      };
    },
    weight: (w) => String(w) as TextStyle['fontWeight'],
  };
}

const ThemeContext = createContext<AbeTheme>(createTheme());

export interface AbeThemeProviderProps {
  theme: ThemeName;
  /** Force a mode; defaults to the device colour scheme. */
  mode?: ColorMode;
  children: ReactNode;
}

export function AbeThemeProvider({ theme, mode, children }: AbeThemeProviderProps) {
  const system = useColorScheme();
  const resolved: ColorMode = mode ?? (system === 'dark' ? 'dark' : 'light');
  const value = useMemo(() => createTheme(theme, resolved), [theme, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAbeTheme(): AbeTheme {
  return useContext(ThemeContext);
}
