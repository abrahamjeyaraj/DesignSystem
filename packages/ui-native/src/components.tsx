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
import { AbeThemeProvider, useAbeTheme } from './theme';

export const ICON_SIZE_SM = 18;
export const ICON_SIZE_MD = 20;
export const ICON_SIZE_LG = 22;
export const AVATAR_SIZE = 40;
export const GRABBER_WIDTH = 40;
export const GRABBER_HEIGHT = 5;
export const CHIP_PADDING_Y = 4;
export const CHIP_PADDING_X = 10;

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info';

const toneStyle = (t: ReturnType<typeof useAbeTheme>, tone: Tone) => ({
  neutral: { bg: t.colors.secondary, fg: t.colors['secondary-foreground'] },
  accent: { bg: t.colors.accent, fg: t.colors['accent-foreground'] },
  success: { bg: t.colors['success-light'], fg: t.colors.success },
  warning: { bg: t.colors['warning-light'], fg: t.colors.warning },
  error: { bg: t.colors['error-light'], fg: t.colors.error },
  info: { bg: t.colors['info-light'], fg: t.colors.info },
}[tone]);

// ---------- Text ----------

export type TextVariant = 'title' | 'headline' | 'body' | 'label' | 'caption' | 'heading' | 'muted';

export interface AbeTextProps extends RNTextProps {
  variant?: TextVariant;
}

export function AbeText({ variant = 'body', style, allowFontScaling = true, ...props }: AbeTextProps) {
  const t = useAbeTheme();
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

export interface AbeButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AbeButton({
  children,
  variant = 'primary',
  size = 'default',
  leadingIcon,
  disabled,
  style,
  textStyle,
  ...props
}: AbeButtonProps) {
  const t = useAbeTheme();
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
        <AbeText variant="label" style={[{ color: fg }, textStyle]}>
          {children}
        </AbeText>
      ) : (
        children
      )}
    </Pressable>
  );
}

// ---------- IconButton ----------

export interface AbeIconButtonProps extends Omit<PressableProps, 'children'> {
  icon: ReactNode;
  accessibilityLabel: string;
}

export function AbeIconButton({ icon, accessibilityLabel, style, ...props }: AbeIconButtonProps) {
  const t = useAbeTheme();
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
      {typeof icon === 'string' ? <AbeText variant="body">{icon}</AbeText> : icon}
    </Pressable>
  );
}

// ---------- Chip ----------

export interface AbeChipProps extends ViewProps {
  tone?: Exclude<Tone, 'info'>;
  children: ReactNode;
}

export function AbeChip({ tone = 'neutral', children, style, ...props }: AbeChipProps) {
  const t = useAbeTheme();
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
        <AbeText variant="label" style={{ color: s.fg, fontSize: 12 }}>
          {children}
        </AbeText>
      ) : (
        children
      )}
    </View>
  );
}

// ---------- Avatar ----------

export interface AbeAvatarProps {
  initials: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function AbeAvatar({ initials, accessibilityLabel, style }: AbeAvatarProps) {
  const t = useAbeTheme();
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
      <AbeText variant="label" style={{ color: t.colors.action, fontSize: 14 }}>
        {initials}
      </AbeText>
    </View>
  );
}

// ---------- ListRow ----------

export interface AbeListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AbeListRow({ leading, title, subtitle, trailing, chevron, onPress, style }: AbeListRowProps) {
  const t = useAbeTheme();
  const content = (
    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
      {typeof leading === 'string' ? <AbeText variant="body">{leading}</AbeText> : leading}
      <View style={{ flex: 1, gap: 2 }}>
        {typeof title === 'string' ? (
          <AbeText variant="body" style={{ fontWeight: t.weight(600) }}>
            {title}
          </AbeText>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <AbeText variant="label" style={{ color: t.colors['muted-foreground'] }}>
            {subtitle}
          </AbeText>
        ) : (
          subtitle
        )}
      </View>
      {typeof trailing === 'string' ? <AbeText variant="body">{trailing}</AbeText> : trailing}
      {chevron && (
        <View style={{ width: ICON_SIZE_SM, height: ICON_SIZE_SM, alignItems: 'center', justifyContent: 'center' }}>
          {typeof chevron === 'string' ? (
            <AbeText variant="label" style={{ color: t.colors['muted-foreground'] }}>
              {chevron}
            </AbeText>
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

export interface AbeStatTileProps {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

export function AbeStatTile({ label, value, meta, tone = 'neutral', style }: AbeStatTileProps) {
  const t = useAbeTheme();
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
        <AbeText variant="label" style={{ color: t.colors['muted-foreground'] }}>
          {label}
        </AbeText>
      ) : (
        label
      )}
      {typeof value === 'string' || typeof value === 'number' ? (
        <AbeText variant="title" style={{ fontSize: 24, fontFamily: t.mobileType.title.family }}>
          {value}
        </AbeText>
      ) : (
        value
      )}
      {meta && (
        typeof meta === 'string' ? (
          <AbeText variant="label" style={{ color: s.fg, fontSize: 12 }}>
            {meta}
          </AbeText>
        ) : (
          meta
        )
      )}
    </View>
  );
}

// ---------- Segmented ----------

export interface AbeSegmentedItem {
  label: string;
  value: string;
}

export interface AbeSegmentedProps {
  items: (AbeSegmentedItem | string)[];
  selected: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function AbeSegmented({ items, selected, onChange, onSelect, style }: AbeSegmentedProps) {
  const t = useAbeTheme();
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
            <AbeText
              variant="label"
              style={{
                color: active ? t.colors.ink : t.colors['ink-body'],
                fontWeight: active ? t.weight(600) : t.weight(500),
              }}
            >
              {item.label}
            </AbeText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Field ----------

export interface AbeFieldProps extends TextInputProps {
  label?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AbeField({ label, inputStyle, containerStyle, style, ...props }: AbeFieldProps) {
  const t = useAbeTheme();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        typeof label === 'string' ? (
          <AbeText variant="label" style={{ color: t.colors['ink-body'] }}>
            {label}
          </AbeText>
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

export interface AbeSearchFieldProps extends TextInputProps {
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function AbeSearchField({ icon, style, inputStyle, ...props }: AbeSearchFieldProps) {
  const t = useAbeTheme();
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
          {typeof icon === 'string' ? <AbeText variant="body">{icon}</AbeText> : icon}
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

export interface AbeLargeTitleProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AbeLargeTitle({ eyebrow, title, trailing, style }: AbeLargeTitleProps) {
  const t = useAbeTheme();
  return (
    <View accessibilityRole="header" style={[{ paddingVertical: 8, paddingHorizontal: 20, gap: 4 }, style]}>
      {eyebrow && (
        typeof eyebrow === 'string' ? (
          <AbeText variant="label" style={{ color: t.colors['muted-foreground'] }}>
            {eyebrow}
          </AbeText>
        ) : (
          eyebrow
        )
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {typeof title === 'string' ? (
          <AbeText variant="title" style={{ fontFamily: t.mobileType.title.family, fontSize: t.mobileType.title.size }}>
            {title}
          </AbeText>
        ) : (
          title
        )}
        {trailing}
      </View>
    </View>
  );
}

// ---------- NavBar ----------

export interface AbeNavBarProps {
  leading?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AbeNavBar({ leading, title, trailing, style }: AbeNavBarProps) {
  const t = useAbeTheme();
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
        {typeof leading === 'string' ? <AbeText variant="body">{leading}</AbeText> : leading}
      </View>
      {typeof title === 'string' ? (
        <AbeText variant="body" style={{ fontSize: 16, fontWeight: t.weight(600) }}>
          {title}
        </AbeText>
      ) : (
        title
      )}
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>
        {typeof trailing === 'string' ? <AbeText variant="body">{trailing}</AbeText> : trailing}
      </View>
    </View>
  );
}

// ---------- SheetHandle ----------

export function AbeSheetHandle({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useAbeTheme();
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

export interface AbeSectionHeaderProps {
  title: ReactNode;
  action?: ReactNode;
  actionTitle?: ReactNode;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AbeSectionHeader({ title, action, actionTitle, onAction, style }: AbeSectionHeaderProps) {
  const t = useAbeTheme();
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
        <AbeText variant="body" style={{ fontSize: 17, fontWeight: t.weight(600) }}>
          {title}
        </AbeText>
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
            <AbeText variant="label" style={{ color: t.colors.action, fontWeight: t.weight(600) }}>
              {act}
            </AbeText>
          ) : (
            act
          )}
        </Pressable>
      )}
    </View>
  );
}

// ---------- TabBar ----------

export interface AbeTabItem {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface AbeTabBarProps {
  items?: AbeTabItem[];
  tabs?: AbeTabItem[];
  selected?: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  onTabPress?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function AbeTabBar({
  items,
  tabs,
  selected,
  activeTab,
  onChange,
  onTabPress,
  style,
}: AbeTabBarProps) {
  const t = useAbeTheme();
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
            {typeof item.icon === 'string' ? <AbeText variant="body">{item.icon}</AbeText> : item.icon}
            <AbeText
              variant="caption"
              style={{
                fontSize: 10.5,
                fontWeight: active ? t.weight(600) : t.weight(500),
                color: active ? t.colors.action : t.colors['ink-muted'],
              }}
            >
              {item.label}
            </AbeText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Card ----------

export function AbeCard({ style, ...props }: ViewProps) {
  const t = useAbeTheme();
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

export interface AbeEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AbeEmptyState({ icon, title, message, action, style }: AbeEmptyStateProps) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }, style]}>
      {typeof icon === 'string' ? <AbeText style={{ fontSize: 32 }}>{icon}</AbeText> : icon}
      {typeof title === 'string' ? (
        <AbeText variant="headline" style={{ textAlign: 'center' }}>
          {title}
        </AbeText>
      ) : (
        title
      )}
      {typeof message === 'string' ? (
        <AbeText variant="muted" style={{ textAlign: 'center' }}>
          {message}
        </AbeText>
      ) : (
        message
      )}
      {action}
    </View>
  );
}

// ---------- Badge ----------

export interface AbeBadgeProps {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AbeBadge({ tone = 'neutral', children, style }: AbeBadgeProps) {
  const t = useAbeTheme();
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
        <AbeText variant="caption" style={{ color: s.fg, fontWeight: t.weight(600) }}>
          {children}
        </AbeText>
      ) : (
        children
      )}
    </View>
  );
}

// ---------- Input ----------

export function AbeInput({ style, ...props }: TextInputProps) {
  const t = useAbeTheme();
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

export interface AbeGalleryProps {
  theme?: ThemeName;
  mode?: ColorMode;
  style?: StyleProp<ViewStyle>;
}

export function AbeGallery({ theme: selectedTheme, mode: selectedMode, style }: AbeGalleryProps = {}) {
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
            <AbeText variant="title" style={{ paddingHorizontal: 16 }}>
              {themeName.toUpperCase()} {themeTokens.supportsDark ? '' : '(Light only - supportsDark: false)'}
            </AbeText>
            {modesToRender.map((mode) => (
              <AbeThemeProvider key={`${themeName}-${mode}`} theme={themeName} mode={mode}>
                <AbeCard style={{ margin: 8, gap: 12 }}>
                  <AbeLargeTitle eyebrow={`${themeName} · ${mode}`} title={`${themeName} (${mode})`} />
                  <AbeNavBar
                    title="Navigation"
                    leading={<AbeButton size="sm" variant="ghost">Back</AbeButton>}
                    trailing={<AbeIconButton icon="⚙" accessibilityLabel="Settings" />}
                  />
                  <AbeSectionHeader title="Section Header" action="See all" onAction={() => {}} />
                  <AbeText variant="title">Title text</AbeText>
                  <AbeText variant="headline">Headline text</AbeText>
                  <AbeText variant="body">Body text with theme tokens</AbeText>
                  <AbeText variant="label">Label text</AbeText>
                  <AbeText variant="caption">Caption text</AbeText>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <AbeButton variant="primary">Primary</AbeButton>
                    <AbeButton variant="secondary">Secondary</AbeButton>
                    <AbeButton variant="outline">Outline</AbeButton>
                    <AbeButton variant="ghost">Ghost</AbeButton>
                    <AbeButton variant="destructive">Destructive</AbeButton>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <AbeAvatar initials="AJ" />
                    <AbeChip tone="neutral">Neutral</AbeChip>
                    <AbeChip tone="accent">Accent</AbeChip>
                    <AbeChip tone="success">Paid</AbeChip>
                    <AbeChip tone="warning">Due</AbeChip>
                    <AbeChip tone="error">Overdue</AbeChip>
                    <AbeBadge tone="info">Info</AbeBadge>
                  </View>
                  <AbeListRow leading={<AbeAvatar initials="TS" />} title="Student Name" subtitle="Class 10 · Maths" chevron="›" onPress={() => {}} />
                  <AbeStatTile label="Collected" value="₹3,84,000" meta="+12% vs Aug" tone="success" />
                  <AbeSegmented items={['All', 'Due', 'Overdue', 'Paid']} selected="All" />
                  <AbeField label="Field Label" placeholder="Enter value..." />
                  <AbeSearchField placeholder="Search students..." icon="🔍" />
                  <AbeSheetHandle />
                  <AbeTabBar items={[{ label: 'Today', value: 'today', icon: '📅' }, { label: 'Students', value: 'students', icon: '👥' }]} selected="today" />
                  <AbeEmptyState title="Empty State" message="No records found in this section." action={<AbeButton size="sm">Create record</AbeButton>} />
                  <AbeInput placeholder="Standard Input..." />
                </AbeCard>
              </AbeThemeProvider>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// Backward-compatible type aliases
export type TextProps = AbeTextProps;
export type ButtonProps = AbeButtonProps;
export type BadgeTone = Tone;
export type IconButtonProps = AbeIconButtonProps;
export type ChipProps = AbeChipProps;
export type AvatarProps = AbeAvatarProps;
export type ListRowProps = AbeListRowProps;
export type StatTileProps = AbeStatTileProps;
export type SegmentedProps = AbeSegmentedProps;
export type FieldProps = AbeFieldProps;
export type SearchFieldProps = AbeSearchFieldProps;
export type LargeTitleProps = AbeLargeTitleProps;
export type NavBarProps = AbeNavBarProps;
export type SheetHandleProps = { style?: StyleProp<ViewStyle> };
export type SectionHeaderProps = AbeSectionHeaderProps;
export type TabBarProps = AbeTabBarProps;
export type CardProps = ViewProps;
export type EmptyStateProps = AbeEmptyStateProps;
export type BadgeProps = AbeBadgeProps;
export type InputProps = TextInputProps;
export type GalleryProps = AbeGalleryProps;

// Backward-compatible component aliases
export {
  AbeText as Text,
  AbeButton as Button,
  AbeIconButton as IconButton,
  AbeChip as Chip,
  AbeAvatar as Avatar,
  AbeListRow as ListRow,
  AbeStatTile as StatTile,
  AbeSegmented as Segmented,
  AbeField as Field,
  AbeSearchField as SearchField,
  AbeLargeTitle as LargeTitle,
  AbeNavBar as NavBar,
  AbeSheetHandle as SheetHandle,
  AbeSectionHeader as SectionHeader,
  AbeTabBar as TabBar,
  AbeCard as Card,
  AbeEmptyState as EmptyState,
  AbeBadge as Badge,
  AbeInput as Input,
  AbeGallery as Gallery,
};
