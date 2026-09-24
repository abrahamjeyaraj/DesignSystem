import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, Text, TextInput, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useDSTheme, type DSTheme } from './theme';

/** Pen v2 fixed metrics (tuition-manager.pen); theme layout/spacing for everything else. */
const PEN = {
  weekCellRadius: 14,
  loadDot: 4,
  countPillHeight: 36,
  presetTileHeight: 64,
  quickActionRadius: 14,
  timelineGutter: 44,
  markSize: 48,
  markIconSize: 22,
  quickActionIconSize: 20,
  activityGlyphSize: 17,
  activityAvatarSize: 36,
  activityRowMinHeight: 52,
  weekStripGap: 6,
  weekCellPadV: 10,
  timelinePad: 14,
};

function sp(t: DSTheme, key: keyof typeof t.spacing) {
  return t.spacing[key];
}

function Txt({
  children,
  size = 'body',
  weight,
  color,
  style,
}: {
  children: ReactNode;
  size?: 'body' | 'caption' | 'label' | 'headline';
  weight?: TextStyle['fontWeight'];
  color?: string;
  style?: TextStyle;
}) {
  const t = useDSTheme();
  const role = t.mobileType[size === 'headline' ? 'headline' : size === 'caption' ? 'caption' : size === 'label' ? 'label' : 'body'];
  const textStyle: TextStyle = {
    fontFamily: t.fontFamily.body,
    fontSize: role.size,
    lineHeight: role.lineHeight,
    fontWeight: weight ?? t.weight(role.weight),
    color: color ?? (size === 'caption' ? t.colors['ink-muted'] : t.colors.foreground),
    ...style,
  };
  return (
    <Text allowFontScaling style={textStyle}>
      {children}
    </Text>
  );
}

// ---------- Snackbar host ----------

export interface DSSnackbarShowOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export interface DSSnackbarPresenter {
  message: string | null;
  actionLabel?: string;
  onAction?: (() => void) | null;
  show: (message: string, options?: DSSnackbarShowOptions) => void;
  dismiss: () => void;
}

const SnackbarContext = createContext<DSSnackbarPresenter | null>(null);

export function useDSSnackbarPresenter(): DSSnackbarPresenter {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useDSSnackbarPresenter must be used within DSSnackbarHost');
  return ctx;
}

export function DSSnackbarHost({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<string | undefined>();
  const [onAction, setOnAction] = useState<(() => void) | null>(null);
  const generationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(null);
    setActionLabel(undefined);
    setOnAction(null);
  }, []);

  const show = useCallback((nextMessage: string, options?: DSSnackbarShowOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    generationRef.current += 1;
    const gen = generationRef.current;
    const durationMs = options?.durationMs ?? 5000;
    setMessage(nextMessage);
    setActionLabel(options?.actionLabel);
    setOnAction(options?.onAction ?? null);
    timerRef.current = setTimeout(() => {
      if (generationRef.current === gen) dismiss();
    }, durationMs);
  }, [dismiss]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const presenter = useMemo(
    () => ({ message, actionLabel, onAction, show, dismiss }),
    [message, actionLabel, onAction, show, dismiss],
  );

  return (
    <SnackbarContext.Provider value={presenter}>
      <View style={[{ flex: 1 }, style]}>
        {children}
        {message != null && (
          <View style={{ position: 'absolute', left: sp(t, '4'), right: sp(t, '4'), bottom: sp(t, '3') }}>
            <DSSnackbarBar
              message={message}
              actionLabel={actionLabel}
              onAction={
                actionLabel && onAction
                  ? () => {
                      onAction();
                      dismiss();
                    }
                  : undefined
              }
            />
          </View>
        )}
      </View>
    </SnackbarContext.Provider>
  );
}

export interface DSSnackbarBarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DSSnackbarBar({ message, actionLabel, onAction, style }: DSSnackbarBarProps) {
  const t = useDSTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: sp(t, '3'),
          paddingHorizontal: sp(t, '4'),
          paddingVertical: sp(t, '3'),
          borderRadius: t.mobileLayout.cardRadius,
          backgroundColor: t.colors['ink-900'],
        },
        style,
      ]}
    >
      <Txt color={t.colors['on-ink']} style={{ flex: 1 }}>{message}</Txt>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{ minWidth: t.mobileLayout.touchTarget, minHeight: t.mobileLayout.touchTarget, justifyContent: 'center' }}
        >
          <Txt size="label" weight={t.weight(600)} color={t.colors['on-ink-accent']}>{actionLabel}</Txt>
        </Pressable>
      )}
    </View>
  );
}

export interface DSWeekStripDay { id: string; weekdaySymbol: string; dayNumber: number; loadCount?: number }
export function DSWeekStrip({ days, selectedDayId, todayDayId, onSelect, style }: { days: DSWeekStripDay[]; selectedDayId: string; todayDayId?: string; onSelect: (day: DSWeekStripDay) => void; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: PEN.weekStripGap }, style]}>
      {days.map((day) => {
        const selected = day.id === selectedDayId;
        const isToday = day.id === todayDayId;
        return (
          <Pressable
            key={day.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${day.weekdaySymbol} ${day.dayNumber}`}
            onPress={() => onSelect(day)}
            style={{
              flex: 1,
              paddingVertical: PEN.weekCellPadV,
              borderRadius: PEN.weekCellRadius,
              backgroundColor: selected ? t.colors.action : t.colors.card,
              borderWidth: isToday && !selected ? 1 : 0,
              borderColor: t.colors.primary,
              alignItems: 'center',
              gap: sp(t, '1'),
            }}
          >
            <Txt size="caption" color={selected ? t.colors['action-foreground'] : t.colors['ink-muted']}>{day.weekdaySymbol}</Txt>
            <Txt weight={t.weight(600)} color={selected ? t.colors['action-foreground'] : t.colors.foreground}>{day.dayNumber}</Txt>
            <View style={{ flexDirection: 'row', gap: sp(t, '1') / 2, height: PEN.loadDot }}>
              {Array.from({ length: Math.min(day.loadCount ?? 0, 4) }).map((_, i) => (
                <View key={i} style={{ width: PEN.loadDot, height: PEN.loadDot, borderRadius: PEN.loadDot, backgroundColor: selected ? t.colors['action-foreground'] : t.colors['accent-2'] }} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DSTimelineRow({ timeStart, timeEnd, state, children, footer, style }: { timeStart: string; timeEnd: string; state: 'past' | 'live' | 'upcoming'; children: ReactNode; footer?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  const live = state === 'live';
  return (
    <View style={[{ flexDirection: 'row', gap: PEN.timelinePad }, style]}>
      <View style={{ width: PEN.timelineGutter, paddingTop: PEN.timelinePad, gap: sp(t, '1') / 2 }}>
        <Txt size="label" weight={t.weight(600)}>{timeStart}</Txt>
        <Txt size="caption">{timeEnd}</Txt>
      </View>
      <View style={{ flex: 1, padding: PEN.timelinePad, gap: sp(t, '3'), borderRadius: t.mobileLayout.cardRadius, backgroundColor: live ? t.colors['ink-900'] : t.colors.card, borderWidth: live ? 0 : 1, borderColor: t.colors.line }}>
        {children}
        {footer}
      </View>
    </View>
  );
}

export function DSCountPill({ symbol, count, accessibilityLabel, style, ...props }: { symbol: string; count: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'children' | 'style'>) {
  const t = useDSTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${symbol} ${count}`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: sp(t, '1'),
          height: PEN.countPillHeight,
          paddingHorizontal: sp(t, '3'),
          borderRadius: t.radius.full,
          backgroundColor: t.colors.muted,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Txt weight={t.weight(600)}>{symbol} {count}</Txt>
    </Pressable>
  );
}

export interface DSPodiumEntry { id: string; name: string; value: string; columnHeight: number; isLeader?: boolean }
export function DSPodium({ entries, renderAvatar, style }: { entries: DSPodiumEntry[]; renderAvatar: (entry: DSPodiumEntry) => ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: PEN.weekStripGap }, style]}>
      {entries.map((entry) => (
        <View
          key={entry.id}
          accessibilityLabel={`${entry.name}, ${entry.value}`}
          style={{
            flex: 1,
            height: entry.columnHeight,
            paddingHorizontal: sp(t, '2'),
            paddingVertical: PEN.timelinePad,
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: PEN.weekStripGap,
            borderRadius: t.mobileLayout.cardRadius,
            backgroundColor: entry.isLeader ? t.colors['ink-900'] : t.colors.card,
            borderWidth: entry.isLeader ? 0 : 1,
            borderColor: t.colors.line,
          }}
        >
          {renderAvatar(entry)}
          <Txt weight={t.weight(600)} color={entry.isLeader ? t.colors['on-ink'] : t.colors.foreground} style={{ textAlign: 'center' }}>{entry.name}</Txt>
          <Txt size="caption" color={entry.isLeader ? t.colors['on-ink-accent'] : t.colors['ink-muted']} style={{ textAlign: 'center' }}>{entry.value}</Txt>
        </View>
      ))}
    </View>
  );
}

export function DSMarkToggle({ value, onValueChange, accessibilityLabel = 'Attendance mark', style }: { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[
        {
          width: PEN.markSize,
          height: PEN.markSize,
          borderRadius: PEN.markSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: value ? t.colors['success-light'] : t.colors.error,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: PEN.markIconSize, color: value ? t.colors.success : t.colors['destructive-foreground'] }}>{value ? '✓' : '✕'}</Text>
    </Pressable>
  );
}

export function DSSummaryBar({ items, style }: { items: { label: string; value: string; tone?: 'success' | 'warning' | 'error' }[]; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  const color = (tone?: string) => (tone === 'success' ? t.colors.success : tone === 'warning' ? t.colors.warning : tone === 'error' ? t.colors.error : t.colors.foreground);
  return (
    <View style={[{ flexDirection: 'row', paddingVertical: PEN.timelinePad, borderRadius: t.mobileLayout.cardRadius, backgroundColor: t.colors.card, borderWidth: 1, borderColor: t.colors.line }, style]}>
      {items.map((item) => (
        <View key={item.label} style={{ flex: 1, alignItems: 'center', gap: sp(t, '1') / 2 }} accessibilityLabel={`${item.label} ${item.value}`}>
          <Txt size="headline" weight={t.weight(600)} color={color(item.tone)}>{item.value}</Txt>
          <Txt size="caption">{item.label}</Txt>
        </View>
      ))}
    </View>
  );
}

export function DSPresetGrid({ options, selectedId, onSelect, style }: { options: { id: string; label: string }[]; selectedId?: string; onSelect: (o: { id: string; label: string }) => void; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: PEN.weekStripGap }, style]}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option)}
            style={{
              flex: 1,
              height: PEN.presetTileHeight,
              borderRadius: t.mobileLayout.cardRadius,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? t.colors.action : t.colors.card,
              borderWidth: selected ? 0 : 1,
              borderColor: t.colors.line,
            }}
          >
            <Txt size="headline" weight={t.weight(600)} color={selected ? t.colors['action-foreground'] : t.colors.foreground}>{option.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DSStepper({ value, onChange, min, max, label = 'Value stepper', style }: { value: number; onChange: (v: number) => void; min: number; max: number; label?: string; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityValue={{ text: String(value) }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: PEN.presetTileHeight,
          paddingHorizontal: t.mobileLayout.gutter,
          borderRadius: t.mobileLayout.cardRadius,
          borderWidth: 1,
          borderColor: t.colors.line,
          backgroundColor: t.colors.card,
        },
        style,
      ]}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease" disabled={value <= min} onPress={() => onChange(value - 1)} style={{ minWidth: t.mobileLayout.touchTarget, minHeight: t.mobileLayout.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
        <Txt>−</Txt>
      </Pressable>
      <Txt size="headline">{value}</Txt>
      <Pressable accessibilityRole="button" accessibilityLabel="Increase" disabled={value >= max} onPress={() => onChange(value + 1)} style={{ minWidth: t.mobileLayout.touchTarget, minHeight: t.mobileLayout.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
        <Txt>+</Txt>
      </Pressable>
    </View>
  );
}

export function DSQuickActionTile({ title, icon, onPress, style }: { title: string; icon: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[
        {
          flex: 1,
          minHeight: t.mobileLayout.touchTarget,
          paddingVertical: sp(t, '3'),
          borderRadius: PEN.quickActionRadius,
          borderWidth: 1,
          borderColor: t.colors.line,
          backgroundColor: t.colors.card,
          alignItems: 'center',
          gap: PEN.weekStripGap,
        },
        style,
      ]}
    >
      {icon}
      <Txt size="caption" color={t.colors['ink-body']}>{title}</Txt>
    </Pressable>
  );
}

export function DSActivityRow({ title, detail, timestamp, leading, actionLabel, onAction, style }: { title: string; detail?: string; timestamp: string; leading: ReactNode; actionLabel?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useDSTheme();
  return (
    <View accessibilityLabel={`${title}, ${timestamp}`} style={[{ flexDirection: 'row', alignItems: 'center', gap: sp(t, '3'), minHeight: PEN.activityRowMinHeight, paddingHorizontal: t.mobileLayout.gutter }, style]}>
      {leading}
      <View style={{ flex: 1, gap: sp(t, '1') / 2 }}>
        <Txt weight={t.weight(600)}>{title}</Txt>
        {detail && <Txt size="caption">{detail}</Txt>}
      </View>
      <View style={{ alignItems: 'flex-end', gap: sp(t, '1') }}>
        <Txt size="caption">{timestamp}</Txt>
        {actionLabel && onAction && (
          <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={{ minWidth: t.mobileLayout.touchTarget, minHeight: t.mobileLayout.touchTarget, justifyContent: 'center' }}>
            <Txt size="caption" weight={t.weight(600)} color={t.colors.primary}>{actionLabel}</Txt>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function DSMultilineField({ label, value, onChangeText, maxLength = 500 }: { label?: string; value: string; onChangeText: (t: string) => void; maxLength?: number }) {
  const t = useDSTheme();
  const bodySize = t.mobileType.body.size;
  return (
    <View style={{ gap: PEN.weekStripGap }}>
      {label && <Txt size="label" color={t.colors['ink-body']}>{label}</Txt>}
      <TextInput
        multiline
        value={value}
        onChangeText={(text) => onChangeText(text.slice(0, maxLength))}
        maxLength={maxLength}
        accessibilityLabel={label}
        placeholderTextColor={t.colors['muted-foreground']}
        style={{
          minHeight: t.mobileLayout.fieldHeight * 2,
          padding: sp(t, '3'),
          borderRadius: t.radius.control,
          borderWidth: 1,
          borderColor: t.colors.line,
          backgroundColor: t.colors.card,
          color: t.colors.ink,
          fontFamily: t.fontFamily.body,
          fontSize: bodySize,
          textAlignVertical: 'top',
        }}
      />
      <Txt size="caption" style={{ textAlign: 'right' }}>{value.length}/{maxLength}</Txt>
    </View>
  );
}

export function PenV2GallerySection() {
  const snackbar = useDSSnackbarPresenter();
  const [week, setWeek] = useState('fri');
  const [preset, setPreset] = useState('5');
  const [step, setStep] = useState(3);
  const [mark, setMark] = useState(true);
  const [notes, setNotes] = useState('Great progress.');
  return (
    <View style={{ gap: 12 }}>
      <Txt size="label" weight={600}>Pen v2</Txt>
      <Pressable accessibilityRole="button" onPress={() => snackbar.show('Ananya +1 ★', { actionLabel: 'Undo', onAction: () => {} })}>
        <Txt size="caption">Show snackbar</Txt>
      </Pressable>
      <DSWeekStrip days={[{ id: 'mon', weekdaySymbol: 'M', dayNumber: 15, loadCount: 3 }, { id: 'fri', weekdaySymbol: 'F', dayNumber: 19, loadCount: 4 }]} selectedDayId={week} todayDayId="fri" onSelect={(d) => setWeek(d.id)} />
      <DSTimelineRow timeStart="09:30" timeEnd="10:30" state="live"><Txt size="headline">Class 10 · Morning</Txt></DSTimelineRow>
      <View style={{ flexDirection: 'row', gap: 12 }}><DSCountPill symbol="★" count={42} /><DSMarkToggle value={mark} onValueChange={setMark} /></View>
      <DSSummaryBar items={[{ label: 'Present', value: '7', tone: 'success' }, { label: 'Absent', value: '1', tone: 'error' }, { label: 'Class avg', value: '92%' }]} />
      <DSPresetGrid options={[{ id: '1', label: '+1' }, { id: '5', label: '+5' }]} selectedId={preset} onSelect={(o) => setPreset(o.id)} />
      <DSStepper value={step} min={1} max={99} onChange={setStep} />
      <DSMultilineField label="Notes" value={notes} onChangeText={setNotes} />
    </View>
  );
}

export function PenV2GallerySectionWithHost() {
  return (
    <DSSnackbarHost>
      <PenV2GallerySection />
    </DSSnackbarHost>
  );
}
