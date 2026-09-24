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
import { type ColorMode, type ThemeName, tokens } from '@abrahamjeyaraj/tokens';
import { DSThemeProvider, useDSTheme } from './theme';

export const ICON_SIZE_SM = 18;
export const ICON_SIZE_MD = 20;
export const ICON_SIZE_LG = 22;
export const AVATAR_SIZE = 40;
export const GRABBER_WIDTH = 40;
export const GRABBER_HEIGHT = 5;
export const CHIP_PADDING_Y = 4;
export const CHIP_PADDING_X = 10;

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info';

const toneStyle = (t: ReturnType<typeof useDSTheme>, tone: Tone) => ({
  neutral: { bg: t.colors.secondary, fg: t.colors['secondary-foreground'] },
  accent: { bg: t.colors.accent, fg: t.colors['accent-foreground'] },
  success: { bg: t.colors['success-light'], fg: t.colors.success },
  warning: { bg: t.colors['warning-light'], fg: t.colors.warning },
  error: { bg: t.colors['error-light'], fg: t.colors.error },
  info: { bg: t.colors['info-light'], fg: t.colors.info },
}[tone]);

// ---------- Text ----------

export type TextVariant = 'title' | 'headline' | 'body' | 'label' | 'caption' | 'heading' | 'muted';

export interface DSTextProps extends RNTextProps {
  variant?: TextVariant;
}

export function DSText({ variant = 'body', style, allowFontScaling = true, ...props }: DSTextProps) {
  const t = useDSTheme();
  const m = t.mobileType;
  const roles: Record<TextVariant, TextStyle> = {
    title: {
      fontFamily: m.title.family,
      fontSize: m.title.size,
      lineHeight: m.title.lineHeight,
      fontWeight: t.weight(m.title.weight),
      color: t.colors.foreground,
    },
    headline: {
      fontFamily: m.headline.family,
      fontSize: m.headline.size,
      lineHeight: m.headline.lineHeight,
      fontWeight: t.weight(m.headline.weight),
      color: t.colors.foreground,
    },
    body: {
      fontFamily: m.body.family,
      fontSize: m.body.size,
      lineHeight: m.body.lineHeight,
      fontWeight: t.weight(m.body.weight),
      color: t.colors.foreground,
    },
    label: {
      fontFamily: m.label.family,
      fontSize: m.label.size,
      lineHeight: m.label.lineHeight,
      fontWeight: t.weight(m.label.weight),
      letterSpacing: t.label.tracking,
      textTransform: t.label.case === 'uppercase' ? 'uppercase' : 'none',
      color: t.colors.ink,
    },
    caption: {
      fontFamily: m.caption.family,
      fontSize: m.caption.size,
      lineHeight: m.caption.lineHeight,
      fontWeight: t.weight(m.caption.weight),
      color: t.colors['ink-muted'],
    },
    heading: {
      fontFamily: t.fontFamily.heading,
      fontSize: t.fontSize['2xl'],
      lineHeight: t.fontSize['2xl'] * t.lineHeight.tight,
      fontWeight: t.weight(t.fontWeight.bold),
      color: t.colors.foreground,
    },
    muted: {
      fontFamily: m.body.family,
      fontSize: m.label.size,
      lineHeight: m.label.lineHeight,
      color: t.colors['muted-foreground'],
    },
  };
  return <RNText allowFontScaling={allowFontScaling} style={[roles[variant], style]} {...props} />;
}

// ---------- Button ----------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'default';
export type ButtonSize = 'sm' | 'default' | 'lg';

export interface DSButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function DSButton({
  children,
  variant = 'primary',
  size = 'default',
  leadingIcon,
  disabled,
  style,
  textStyle,
  ...props
}: DSButtonProps) {
  const t = useDSTheme();
  const v = variant === 'default' ? 'primary' : variant;
  const surface = {
    primary: [t.colors.action, t.colors['action-foreground']],
    secondary: [t.colors.card, t.colors.ink],
    ghost: ['transparent', t.colors.ink],
    destructive: [t.colors.destructive, t.colors['destructive-foreground']],
    outline: ['transparent', t.colors.ink],
  } as const;
  const [bg, fg] = surface[v];
  const height = { sm: 40, default: t.mobileLayout.controlHeight, lg: 48 }[size];
  const paddingH = { sm: 12, default: 20, lg: 32 }[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: Math.max(height, t.mobileLayout.touchTarget),
          paddingHorizontal: paddingH,
          borderRadius: t.radius.button,
          backgroundColor: bg,
          borderWidth: v === 'outline' || v === 'secondary' ? 1 : 0,
          borderColor: t.colors.line,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? (style as any)({ pressed }) : style,
      ]}
      {...props}
    >
      {leadingIcon}
      {typeof children === 'string' ? (
        <DSText variant="label" style={[{ color: fg }, textStyle]}>
          {children}
        </DSText>
      ) : (
        children
      )}
    </Pressable>
  );
}

// ---------- IconButton ----------

export interface DSIconButtonProps extends Omit<PressableProps, 'children'> {
  icon: ReactNode;
  accessibilityLabel: string;
}

export function DSIconButton({ icon, accessibilityLabel, style, ...props }: DSIconButtonProps) {
  const t = useDSTheme();
  const size = Math.max(t.mobileLayout.touchTarget, 44);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.card,
          borderWidth: 1,
          borderColor: t.colors.line,
          borderRadius: t.radius.button,
          opacity: pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? (style as any)({ pressed }) : style,
      ]}
      {...props}
    >
      {typeof icon === 'string' ? <DSText variant="body">{icon}</DSText> : icon}
    </Pressable>
  );
}

// ---------- Chip ----------

export interface DSChipProps extends ViewProps {
  tone?: Exclude<Tone, 'info'>;
  children: ReactNode;
}

export function DSChip({ tone = 'neutral', children, style, ...props }: DSChipProps) {
  const t = useDSTheme();
  const s = toneStyle(t, tone);
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${tone} ${typeof children === 'string' ? children : 'chip'}`}
      style={[
        {
          alignSelf: 'flex-start',
          paddingVertical: CHIP_PADDING_Y,
          paddingHorizontal: CHIP_PADDING_X,
          borderRadius: 999,
          backgroundColor: s.bg,
        },
        style,
      ]}
      {...props}
    >
      {typeof children === 'string' ? (
        <DSText variant="label" style={{ color: s.fg, fontSize: 12 }}>
          {children}
        </DSText>
      ) : (
        children
      )}
    </View>
  );
}

// ---------- Avatar ----------

export interface DSAvatarProps {
  initials: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function DSAvatar({ initials, accessibilityLabel, style }: DSAvatarProps) {
  const t = useDSTheme();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Avatar ${initials}`}
      style={[
        {
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.muted,
        },
        style,
      ]}
    >
      <DSText variant="label" style={{ color: t.colors.action, fontSize: 14 }}>
        {initials}
      </DSText>
    </View>
  );
}

// ---------- ListRow ----------

export interface DSListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DSListRow({ leading, title, subtitle, trailing, chevron, onPress, style }: DSListRowProps) {
  const t = useDSTheme();
  const content = (
    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
      {typeof leading === 'string' ? <DSText variant="body">{leading}</DSText> : leading}
      <View style={{ flex: 1, gap: 2 }}>
        {typeof title === 'string' ? (
          <DSText variant="body" style={{ fontWeight: t.weight(600) }}>
            {title}
          </DSText>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <DSText variant="label" style={{ color: t.colors['muted-foreground'] }}>
            {subtitle}
          </DSText>
        ) : (
          subtitle
        )}
      </View>
      {typeof trailing === 'string' ? <DSText variant="body">{trailing}</DSText> : trailing}
      {chevron && (
        <View style={{ width: ICON_SIZE_SM, height: ICON_SIZE_SM, alignItems: 'center', justifyContent: 'center' }}>
          {typeof chevron === 'string' ? (
            <DSText variant="label" style={{ color: t.colors['muted-foreground'] }}>
              {chevron}
            </DSText>
          ) : (
            chevron
          )}
        </View>
      )}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          {
            minHeight: t.mobileLayout.touchTarget,
            justifyContent: 'center',
            backgroundColor: t.colors.card,
            opacity: pressed ? 0.85 : 1,
          },
          typeof style === 'function' ? (style as any)({ pressed }) : style,
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      style={[
        {
          minHeight: t.mobileLayout.touchTarget,
          justifyContent: 'center',
          backgroundColor: t.colors.card,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}

// ---------- StatTile ----------

export interface DSStatTileProps {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

export function DSStatTile({ label, value, meta, tone = 'neutral', style }: DSStatTileProps) {
  const t = useDSTheme();
  const s = toneStyle(t, tone);
  return (
    <View
      accessibilityLabel={`${typeof label === 'string' ? label : 'stat'}: ${typeof value === 'string' ? value : ''}`}
      style={[
        {
          padding: 16,
          backgroundColor: t.colors.card,
          borderRadius: t.mobileLayout.cardRadius,
          borderWidth: 1,
          borderColor: t.colors.line,
          gap: 4,
        },
        t.shadow('card'),
        style,
      ]}
    >
      {typeof label === 'string' ? (
        <DSText variant="label" style={{ color: t.colors['muted-foreground'] }}>
          {label}
        </DSText>
      ) : (
        label
      )}
      {typeof value === 'string' || typeof value === 'number' ? (
        <DSText variant="title" style={{ fontSize: 24, fontFamily: t.mobileType.title.family }}>
          {value}
        </DSText>
      ) : (
        value
      )}
      {meta && (
        typeof meta === 'string' ? (
          <DSText variant="label" style={{ color: s.fg, fontSize: 12 }}>
            {meta}
          </DSText>
        ) : (
          meta
        )
      )}
    </View>
  );
}

// ---------- Segmented ----------

export interface DSSegmentedItem {
  label: string;
  value: string;
}

export interface DSSegmentedProps {
  items: (DSSegmentedItem | string)[];
  selected: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function DSSegmented({ items, selected, onChange, onSelect, style }: DSSegmentedProps) {
  const t = useDSTheme();
  const handleSelect = (val: string) => {
    onChange?.(val);
    onSelect?.(val);
  };
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          padding: 4,
          borderRadius: 999,
          backgroundColor: t.colors.secondary,
        },
        style,
      ]}
    >
      {items.map((raw) => {
        const item = typeof raw === 'string' ? { label: raw, value: raw } : raw;
        const active = item.value === selected;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => handleSelect(item.value)}
            style={[
              {
                flex: 1,
                minHeight: Math.max(36, t.mobileLayout.touchTarget),
                minWidth: t.mobileLayout.touchTarget,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
              },
              active && {
                backgroundColor: t.colors.card,
                ...t.shadow('sm'),
              },
            ]}
          >
            <DSText
              variant="label"
              style={{
                color: active ? t.colors.ink : t.colors['ink-body'],
                fontWeight: active ? t.weight(600) : t.weight(500),
              }}
            >
              {item.label}
            </DSText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Field ----------

export interface DSFieldProps extends TextInputProps {
  label?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function DSField({ label, inputStyle, containerStyle, style, ...props }: DSFieldProps) {
  const t = useDSTheme();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        typeof label === 'string' ? (
          <DSText variant="label" style={{ color: t.colors['ink-body'] }}>
            {label}
          </DSText>
        ) : (
          label
        )
      )}
      <View
        style={[
          {
            height: t.mobileLayout.fieldHeight,
            paddingHorizontal: 16,
            borderRadius: t.radius.control,
            borderWidth: 1,
            borderColor: t.colors.line,
            backgroundColor: t.colors.card,
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <TextInput
          placeholderTextColor={t.colors['muted-foreground']}
          style={[
            {
              fontSize: 16,
              color: t.colors.ink,
              fontFamily: t.fontFamily.body,
              padding: 0,
            },
            inputStyle,
          ]}
          {...props}
        />
      </View>
    </View>
  );
}

// ---------- SearchField ----------

export interface DSSearchFieldProps extends TextInputProps {
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function DSSearchField({ icon, style, inputStyle, ...props }: DSSearchFieldProps) {
  const t = useDSTheme();
  return (
    <View
      accessibilityRole="search"
      style={[
        {
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: t.colors.secondary,
        },
        style,
      ]}
    >
      {icon && (
        <View style={{ width: ICON_SIZE_SM, height: ICON_SIZE_SM, alignItems: 'center', justifyContent: 'center' }}>
          {typeof icon === 'string' ? <DSText variant="body">{icon}</DSText> : icon}
        </View>
      )}
      <TextInput
        placeholderTextColor={t.colors['muted-foreground']}
        style={[
          {
            flex: 1,
            color: t.colors.ink,
            fontSize: t.mobileType.body.size,
            fontFamily: t.fontFamily.body,
            padding: 0,
          },
          inputStyle,
        ]}
        {...props}
      />
    </View>
  );
}

// ---------- LargeTitle ----------

export interface DSLargeTitleProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DSLargeTitle({ eyebrow, title, trailing, style }: DSLargeTitleProps) {
  const t = useDSTheme();
  return (
    <View accessibilityRole="header" style={[{ paddingVertical: 8, paddingHorizontal: 20, gap: 4 }, style]}>
      {eyebrow && (
        typeof eyebrow === 'string' ? (
          <DSText variant="label" style={{ color: t.colors['muted-foreground'] }}>
            {eyebrow}
          </DSText>
        ) : (
          eyebrow
        )
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {typeof title === 'string' ? (
          <DSText variant="title" style={{ fontFamily: t.mobileType.title.family, fontSize: t.mobileType.title.size }}>
            {title}
          </DSText>
        ) : (
          title
        )}
        {trailing}
      </View>
    </View>
  );
}

// ---------- NavBar ----------

export interface DSNavBarProps {
  leading?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DSNavBar({ leading, title, trailing, style }: DSNavBarProps) {
  const t = useDSTheme();
  return (
    <View
      accessibilityRole="header"
      style={[
        {
          height: 52,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ minWidth: 44, alignItems: 'flex-start' }}>
        {typeof leading === 'string' ? <DSText variant="body">{leading}</DSText> : leading}
      </View>
      {typeof title === 'string' ? (
        <DSText variant="body" style={{ fontSize: 16, fontWeight: t.weight(600) }}>
          {title}
        </DSText>
      ) : (
        title
      )}
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>
        {typeof trailing === 'string' ? <DSText variant="body">{trailing}</DSText> : trailing}
      </View>
    </View>
  );
}

// ---------- SheetHandle ----------

export function DSSheetHandle({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Sheet handle"
      style={[{ height: 20, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <View style={{ width: GRABBER_WIDTH, height: GRABBER_HEIGHT, borderRadius: 3, backgroundColor: t.colors.line }} />
    </View>
  );
}

// ---------- SectionHeader ----------

export interface DSSectionHeaderProps {
  title: ReactNode;
  action?: ReactNode;
  actionTitle?: ReactNode;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DSSectionHeader({ title, action, actionTitle, onAction, style }: DSSectionHeaderProps) {
  const t = useDSTheme();
  const act = action ?? actionTitle;
  return (
    <View
      style={[
        {
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        },
        style,
      ]}
    >
      {typeof title === 'string' ? (
        <DSText variant="body" style={{ fontSize: 17, fontWeight: t.weight(600) }}>
          {title}
        </DSText>
      ) : (
        title
      )}
      {act && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{ minHeight: t.mobileLayout.touchTarget, minWidth: t.mobileLayout.touchTarget, justifyContent: 'center', alignItems: 'center' }}
        >
          {typeof act === 'string' ? (
            <DSText variant="label" style={{ color: t.colors.action, fontWeight: t.weight(600) }}>
              {act}
            </DSText>
          ) : (
            act
          )}
        </Pressable>
      )}
    </View>
  );
}

// ---------- TabBar ----------

export interface DSTabItem {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface DSTabBarProps {
  items?: DSTabItem[];
  tabs?: DSTabItem[];
  selected?: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  onTabPress?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function DSTabBar({
  items,
  tabs,
  selected,
  activeTab,
  onChange,
  onTabPress,
  style,
}: DSTabBarProps) {
  const t = useDSTheme();
  const tabList = items ?? tabs ?? [];
  const current = selected ?? activeTab ?? (tabList[0]?.value ?? '');
  const handleSelect = (val: string) => {
    onChange?.(val);
    onTabPress?.(val);
  };
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          padding: 6,
          borderRadius: 999,
          backgroundColor: t.colors.card,
          borderWidth: 1,
          borderColor: t.colors.line,
          ...t.shadow('pop'),
        },
        style,
      ]}
    >
      {tabList.map((item) => {
        const active = item.value === current;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => handleSelect(item.value)}
            style={{
              flex: 1,
              minHeight: t.mobileLayout.touchTarget,
              minWidth: t.mobileLayout.touchTarget,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: active ? `${t.colors.action}1A` : 'transparent',
            }}
          >
            {typeof item.icon === 'string' ? <DSText variant="body">{item.icon}</DSText> : item.icon}
            <DSText
              variant="caption"
              style={{
                fontSize: 10.5,
                fontWeight: active ? t.weight(600) : t.weight(500),
                color: active ? t.colors.action : t.colors['ink-muted'],
              }}
            >
              {item.label}
            </DSText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Card ----------

export function DSCard({ style, ...props }: ViewProps) {
  const t = useDSTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.card,
          borderRadius: t.mobileLayout.cardRadius,
          borderWidth: 1,
          borderColor: t.colors.line,
          padding: 16,
          ...t.shadow('card'),
        },
        style,
      ]}
      {...props}
    />
  );
}

// ---------- EmptyState ----------

export interface DSEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DSEmptyState({ icon, title, message, action, style }: DSEmptyStateProps) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }, style]}>
      {typeof icon === 'string' ? <DSText style={{ fontSize: 32 }}>{icon}</DSText> : icon}
      {typeof title === 'string' ? (
        <DSText variant="headline" style={{ textAlign: 'center' }}>
          {title}
        </DSText>
      ) : (
        title
      )}
      {typeof message === 'string' ? (
        <DSText variant="muted" style={{ textAlign: 'center' }}>
          {message}
        </DSText>
      ) : (
        message
      )}
      {action}
    </View>
  );
}

// ---------- Badge ----------

export interface DSBadgeProps {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DSBadge({ tone = 'neutral', children, style }: DSBadgeProps) {
  const t = useDSTheme();
  const s = toneStyle(t, tone);
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 2,
          borderRadius: 999,
          backgroundColor: s.bg,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <DSText variant="caption" style={{ color: s.fg, fontWeight: t.weight(600) }}>
          {children}
        </DSText>
      ) : (
        children
      )}
    </View>
  );
}

// ---------- Input ----------

export function DSInput({ style, ...props }: TextInputProps) {
  const t = useDSTheme();
  return (
    <TextInput
      placeholderTextColor={t.colors['ink-muted']}
      style={[
        {
          minHeight: t.mobileLayout.touchTarget,
          paddingHorizontal: 12,
          borderRadius: t.radius.control,
          borderWidth: 1,
          borderColor: t.colors.line,
          backgroundColor: t.colors.subtle,
          color: t.colors.ink,
          fontFamily: t.fontFamily.body,
          fontSize: t.fontSize.base,
        },
        style,
      ]}
      {...props}
    />
  );
}

// ---------- Gallery ----------

export interface DSGalleryProps {
  theme?: ThemeName;
  mode?: ColorMode;
  style?: StyleProp<ViewStyle>;
}

export function DSGallery({ theme: selectedTheme, mode: selectedMode, style }: DSGalleryProps = {}) {
  const themesToRender: readonly ThemeName[] = selectedTheme ? [selectedTheme] : (['tuition', 'church', 'bible'] as const);

  return (
    <View style={style}>
      {themesToRender.map((themeName) => {
        const themeTokens = tokens.themes[themeName];
        const resolvedSelectedMode: ColorMode | undefined = selectedMode
          ? (themeTokens.supportsDark ? selectedMode : 'light')
          : undefined;
        const modesToRender: readonly ColorMode[] = resolvedSelectedMode
          ? [resolvedSelectedMode]
          : themeTokens.supportsDark
            ? (['light', 'dark'] as const)
            : (['light'] as const);

        return (
          <View key={themeName} style={{ marginBottom: 24, gap: 16 }}>
            <DSText variant="title" style={{ paddingHorizontal: 16 }}>
              {themeName.toUpperCase()} {themeTokens.supportsDark ? '' : '(Light only - supportsDark: false)'}
            </DSText>
            {modesToRender.map((mode) => (
              <DSThemeProvider key={`${themeName}-${mode}`} theme={themeName} mode={mode}>
                <DSCard style={{ margin: 8, gap: 12 }}>
                  <DSLargeTitle eyebrow={`${themeName} · ${mode}`} title={`${themeName} (${mode})`} />
                  <DSNavBar
                    title="Navigation"
                    leading={<DSButton size="sm" variant="ghost">Back</DSButton>}
                    trailing={<DSIconButton icon="⚙" accessibilityLabel="Settings" />}
                  />
                  <DSSectionHeader title="Section Header" action="See all" onAction={() => {}} />
                  <DSText variant="title">Title text</DSText>
                  <DSText variant="headline">Headline text</DSText>
                  <DSText variant="body">Body text with theme tokens</DSText>
                  <DSText variant="label">Label text</DSText>
                  <DSText variant="caption">Caption text</DSText>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <DSButton variant="primary">Primary</DSButton>
                    <DSButton variant="secondary">Secondary</DSButton>
                    <DSButton variant="outline">Outline</DSButton>
                    <DSButton variant="ghost">Ghost</DSButton>
                    <DSButton variant="destructive">Destructive</DSButton>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <DSAvatar initials="AJ" />
                    <DSChip tone="neutral">Neutral</DSChip>
                    <DSChip tone="accent">Accent</DSChip>
                    <DSChip tone="success">Paid</DSChip>
                    <DSChip tone="warning">Due</DSChip>
                    <DSChip tone="error">Overdue</DSChip>
                    <DSBadge tone="info">Info</DSBadge>
                  </View>
                  <DSListRow leading={<DSAvatar initials="TS" />} title="Student Name" subtitle="Class 10 · Maths" chevron="›" onPress={() => {}} />
                  <DSStatTile label="Collected" value="₹3,84,000" meta="+12% vs Aug" tone="success" />
                  <DSSegmented items={['All', 'Due', 'Overdue', 'Paid']} selected="All" />
                  <DSField label="Field Label" placeholder="Enter value..." />
                  <DSSearchField placeholder="Search students..." icon="🔍" />
                  <DSSheetHandle />
                  <DSTabBar items={[{ label: 'Today', value: 'today', icon: '📅' }, { label: 'Students', value: 'students', icon: '👥' }]} selected="today" />
                  <DSEmptyState title="Empty State" message="No records found in this section." action={<DSButton size="sm">Create record</DSButton>} />
                  <DSInput placeholder="Standard Input..." />
                </DSCard>
              </DSThemeProvider>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// Backward-compatible type aliases
export type TextProps = DSTextProps;
export type ButtonProps = DSButtonProps;
export type BadgeTone = Tone;
export type IconButtonProps = DSIconButtonProps;
export type ChipProps = DSChipProps;
export type AvatarProps = DSAvatarProps;
export type ListRowProps = DSListRowProps;
export type StatTileProps = DSStatTileProps;
export type SegmentedProps = DSSegmentedProps;
export type FieldProps = DSFieldProps;
export type SearchFieldProps = DSSearchFieldProps;
export type LargeTitleProps = DSLargeTitleProps;
export type NavBarProps = DSNavBarProps;
export type SheetHandleProps = { style?: StyleProp<ViewStyle> };
export type SectionHeaderProps = DSSectionHeaderProps;
export type TabBarProps = DSTabBarProps;
export type CardProps = ViewProps;
export type EmptyStateProps = DSEmptyStateProps;
export type BadgeProps = DSBadgeProps;
export type InputProps = TextInputProps;
export type GalleryProps = DSGalleryProps;

// Backward-compatible component aliases
export {
  DSText as Text,
  DSButton as Button,
  DSIconButton as IconButton,
  DSChip as Chip,
  DSAvatar as Avatar,
  DSListRow as ListRow,
  DSStatTile as StatTile,
  DSSegmented as Segmented,
  DSField as Field,
  DSSearchField as SearchField,
  DSLargeTitle as LargeTitle,
  DSNavBar as NavBar,
  DSSheetHandle as SheetHandle,
  DSSectionHeader as SectionHeader,
  DSTabBar as TabBar,
  DSCard as Card,
  DSEmptyState as EmptyState,
  DSBadge as Badge,
  DSInput as Input,
  DSGallery as Gallery,
};
