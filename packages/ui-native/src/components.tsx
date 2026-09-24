import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  Text as RNText,
  TextInput,
  type TextInputProps,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useAbeTheme } from './theme';

// ---------- Text ----------

export type TextVariant = 'body' | 'heading' | 'title' | 'label' | 'muted' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...props }: TextProps) {
  const t = useAbeTheme();
  const variants: Record<TextVariant, TextStyle> = {
    body: { fontFamily: t.fontFamily.body, fontSize: t.fontSize.base, color: t.colors.foreground },
    heading: {
      fontFamily: t.fontFamily.heading,
      fontSize: t.fontSize['2xl'],
      fontWeight: t.weight(t.fontWeight.bold),
      lineHeight: t.fontSize['2xl'] * t.lineHeight.tight,
      color: t.colors.foreground,
    },
    title: {
      fontFamily: t.fontFamily.heading,
      fontSize: t.fontSize.xl,
      fontWeight: t.weight(t.fontWeight.semibold),
      color: t.colors.foreground,
    },
    label: {
      fontFamily: t.fontFamily.label,
      fontSize: t.label.size,
      fontWeight: t.weight(t.label.weight),
      letterSpacing: t.label.tracking,
      textTransform: t.label.case === 'uppercase' ? 'uppercase' : 'none',
      color: t.colors.ink,
    },
    muted: { fontFamily: t.fontFamily.body, fontSize: t.fontSize.sm, color: t.colors['muted-foreground'] },
    caption: { fontFamily: t.fontFamily.body, fontSize: t.fontSize.xs, color: t.colors['ink-muted'] },
  };
  return <RNText style={[variants[variant], style]} {...props} />;
}

// ---------- Button ----------

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'default' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({ children, variant = 'default', size = 'default', disabled, style, textStyle, ...props }: ButtonProps) {
  const t = useAbeTheme();
  const c = t.colors;
  const surface: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    default: { bg: c.action, fg: c['action-foreground'] },
    secondary: { bg: c.subtle, fg: c.ink },
    outline: { bg: 'transparent', fg: c.ink, border: c.line },
    ghost: { bg: 'transparent', fg: c.ink },
    destructive: { bg: c.destructive, fg: c['destructive-foreground'] },
  };
  const height = { sm: 40, default: t.minTouchTarget, lg: 48 }[size];
  const padding = { sm: t.spacing['4'], default: t.spacing['5'], lg: t.spacing['8'] }[size];
  const s = surface[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: padding,
          borderRadius: t.radius.button,
          backgroundColor: s.bg,
          borderWidth: s.border ? 1 : 0,
          borderColor: s.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: t.spacing['2'],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text variant="label" style={[{ color: s.fg }, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// ---------- Card ----------

export function Card({ style, ...props }: ViewProps) {
  const t = useAbeTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.card,
          borderRadius: t.radius.card,
          padding: t.spacing['6'],
          ...t.shadow('card'),
        },
        style,
      ]}
      {...props}
    />
  );
}

// ---------- Input ----------

export function Input({ style, ...props }: TextInputProps) {
  const t = useAbeTheme();
  return (
    <TextInput
      placeholderTextColor={t.colors['ink-muted']}
      style={[
        {
          minHeight: t.minTouchTarget,
          borderRadius: t.radius.control,
          borderWidth: 1,
          borderColor: t.colors.line,
          backgroundColor: t.colors.subtle,
          color: t.colors.ink,
          paddingHorizontal: t.spacing['3'],
          fontFamily: t.fontFamily.body,
          fontSize: t.fontSize.base,
        },
        style,
      ]}
      {...props}
    />
  );
}

// ---------- Badge ----------

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const t = useAbeTheme();
  const c = t.colors;
  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: c.secondary, fg: c['secondary-foreground'] },
    accent: { bg: c.accent, fg: c['accent-foreground'] },
    success: { bg: c['success-light'], fg: c.success },
    warning: { bg: c['warning-light'], fg: c.warning },
    error: { bg: c['error-light'], fg: c.error },
    info: { bg: c['info-light'], fg: c.info },
  };
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: tones[tone].bg,
        borderRadius: t.radius.full,
        paddingHorizontal: t.spacing['3'],
        paddingVertical: 2,
      }}
    >
      <Text style={{ color: tones[tone].fg, fontSize: t.fontSize.xs, fontWeight: t.weight(t.fontWeight.semibold) }}>
        {children}
      </Text>
    </View>
  );
}
