'use client';
import * as React from 'react';
import { cn } from './cn';

/** Pattern layout metrics with no dedicated token role (see native DSPenMetrics / DSComponentMetrics). */
const patternMetrics = {
  weekCellRadius: 'rounded-[calc(var(--spacing)*3.5)]',
  loadDot: 'size-1',
  countPillHeight: 'h-9',
  presetTileHeight: 'h-16',
  quickActionRadius: 'rounded-[calc(var(--spacing)*3.5)]',
  timelineGutter: 'w-11',
  markSize: 'size-12',
  markIcon: 'text-lg',
};

// ---------- Snackbar ----------

export interface DSSnackbarShowOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface SnackbarState {
  message: string | null;
  actionLabel?: string;
  onAction?: (() => void) | null;
  generation: number;
}

const SnackbarContext = React.createContext<{
  show: (message: string, options?: DSSnackbarShowOptions) => void;
  dismiss: () => void;
} | null>(null);

export function useDSSnackbarPresenter() {
  const ctx = React.useContext(SnackbarContext);
  if (!ctx) throw new Error('useDSSnackbarPresenter must be used within DSSnackbarHost');
  return ctx;
}

export function DSSnackbarHost({ children, className }: { children: React.ReactNode; className?: string }) {
  const [state, setState] = React.useState<SnackbarState>({ message: null, generation: 0 });
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState((s) => ({ ...s, message: null, actionLabel: undefined, onAction: null }));
  }, []);

  const show = React.useCallback((message: string, options?: DSSnackbarShowOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState((s) => {
      const generation = s.generation + 1;
      const durationMs = options?.durationMs ?? 5000;
      timerRef.current = setTimeout(() => {
        setState((cur) => (cur.generation === generation ? { ...cur, message: null, actionLabel: undefined, onAction: null } : cur));
      }, durationMs);
      return {
        message,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction ?? null,
        generation,
      };
    });
  }, []);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <SnackbarContext.Provider value={{ show, dismiss }}>
      <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
        {children}
        {state.message != null && (
          <div className="pointer-events-none absolute inset-x-4 bottom-3">
            <DSSnackbarBar
              className="pointer-events-auto"
              message={state.message}
              actionLabel={state.actionLabel}
              onAction={
                state.actionLabel && state.onAction
                  ? () => {
                      state.onAction?.();
                      dismiss();
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </SnackbarContext.Provider>
  );
}

export interface DSSnackbarBarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function DSSnackbarBar({ message, actionLabel, onAction, className }: DSSnackbarBarProps) {
  return (
    <div role="status" aria-live="polite" className={cn('flex items-center gap-3 rounded-card bg-ink-900 px-4 py-3 font-body text-on-ink', className)}>
      <span className="flex-1 text-base leading-normal">{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[length:var(--min-touch-target)] min-w-[length:var(--min-touch-target)] cursor-pointer border-0 bg-transparent font-body text-sm font-semibold text-on-ink-accent"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export interface DSWeekStripDay { id: string; weekdaySymbol: string; dayNumber: number; loadCount?: number }
export function DSWeekStrip({ days, selectedDayId, todayDayId, onSelect, className }: { days: DSWeekStripDay[]; selectedDayId: string; todayDayId?: string; onSelect: (d: DSWeekStripDay) => void; className?: string }) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {days.map((day) => {
        const selected = day.id === selectedDayId;
        const isToday = day.id === todayDayId;
        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(day)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 font-body',
              patternMetrics.weekCellRadius,
              selected ? 'bg-action text-action-foreground' : 'bg-card text-foreground',
              isToday && !selected && 'border border-primary',
            )}
          >
            <span className={cn('text-sm text-ink-muted', selected ? 'text-inherit' : 'text-ink-muted')}>{day.weekdaySymbol}</span>
            <span className="text-base font-semibold">{day.dayNumber}</span>
            <span className="flex h-1 justify-center gap-0.5">
              {Array.from({ length: Math.min(day.loadCount ?? 0, 4) }).map((_, i) => (
                <span key={i} className={cn(patternMetrics.loadDot, 'rounded-full', selected ? 'bg-current' : 'bg-accent-2')} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DSTimelineRow({ timeStart, timeEnd, state, children, footer, className }: { timeStart: string; timeEnd: string; state: 'past' | 'live' | 'upcoming'; children: React.ReactNode; footer?: React.ReactNode; className?: string }) {
  const live = state === 'live';
  return (
    <div className={cn('flex gap-3.5', className)}>
      <div className={cn(patternMetrics.timelineGutter, 'pt-3.5 font-body')}>
        <div className="label-text text-ink-body font-semibold text-ink">{timeStart}</div>
        <div className="text-sm text-ink-muted text-ink-muted">{timeEnd}</div>
      </div>
      <div className={cn('flex flex-1 flex-col gap-2.5 rounded-card p-3.5', live ? 'bg-ink-900 text-on-ink' : 'border border-line bg-card text-foreground')}>
        {children}
        {footer}
      </div>
    </div>
  );
}

export function DSCountPill({ symbol, count, onClick, className, 'aria-label': ariaLabel }: { symbol: string; count: number; onClick?: () => void; className?: string; 'aria-label'?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? `${symbol} ${count}`}
      className={cn(patternMetrics.countPillHeight, 'rounded-full border-0 bg-muted px-3 font-body text-base font-semibold text-ink cursor-pointer', className)}
    >
      {symbol} {count}
    </button>
  );
}

export function DSPodium({ entries, renderAvatar, className }: { entries: { id: string; name: string; value: string; height: number; leader?: boolean }[]; renderAvatar: (id: string) => React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-end gap-2.5', className)}>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{ height: e.height }}
          className={cn(
            'flex flex-1 flex-col items-center justify-end gap-1.5 px-2 py-3.5 rounded-card font-body',
            e.leader ? 'bg-ink-900 text-on-ink' : 'border border-line bg-card text-foreground',
          )}
        >
          {renderAvatar(e.id)}
          <strong className="text-center text-base">{e.name}</strong>
          <span className={cn('text-center text-sm text-ink-muted', e.leader ? 'text-on-ink-accent' : 'text-ink-muted')}>{e.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DSMarkToggle({ checked, onCheckedChange, className, 'aria-label': ariaLabel }: { checked: boolean; onCheckedChange: (v: boolean) => void; className?: string; 'aria-label': string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        patternMetrics.markSize,
        'rounded-full border-0 font-body cursor-pointer',
        patternMetrics.markIcon,
        checked ? 'bg-success-light text-success' : 'bg-error text-destructive-foreground',
        className,
      )}
    >
      {checked ? '✓' : '✕'}
    </button>
  );
}

export function DSSummaryBar({ items, className }: { items: { label: string; value: string; tone?: 'success' | 'error' }[]; className?: string }) {
  return (
    <div className={cn('flex rounded-card border border-line bg-card py-3.5', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-0.5 text-center font-body">
          <div className={cn('text-xl font-semibold', item.tone === 'success' ? 'text-success' : item.tone === 'error' ? 'text-error' : 'text-foreground')}>{item.value}</div>
          <div className="text-sm text-ink-muted text-ink-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DSPresetGrid({ options, selectedId, onSelect, className }: { options: { id: string; label: string }[]; selectedId?: string; onSelect: (o: { id: string; label: string }) => void; className?: string }) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      {options.map((o) => {
        const selected = o.id === selectedId;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(o)}
            className={cn(
              patternMetrics.presetTileHeight,
              'flex flex-1 items-center justify-center rounded-card font-body text-xl font-semibold cursor-pointer',
              selected ? 'bg-action text-action-foreground' : 'border border-line bg-card text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DSStepper({ value, min, max, onChange, label = 'Value stepper', className }: { value: number; min: number; max: number; onChange: (v: number) => void; label?: string; className?: string }) {
  return (
    <div aria-label={label} className={cn(patternMetrics.presetTileHeight, 'flex items-center justify-between rounded-card border border-line bg-card px-5 font-body', className)}>
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(value - 1)} className="min-h-[length:var(--min-touch-target)] min-w-[length:var(--min-touch-target)] border-0 bg-transparent cursor-pointer disabled:opacity-50">−</button>
      <span className="text-xl font-semibold">{value}</span>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)} className="min-h-[length:var(--min-touch-target)] min-w-[length:var(--min-touch-target)] border-0 bg-transparent cursor-pointer disabled:opacity-50">+</button>
    </div>
  );
}

export function DSQuickActionTile({ title, icon, onClick, className }: { title: string; icon: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex min-h-[length:var(--min-touch-target)] flex-1 flex-col items-center gap-1.5 border border-line bg-card py-3 font-body cursor-pointer', patternMetrics.quickActionRadius, className)}>
      {icon}
      <span className="text-sm text-ink-muted text-ink-body">{title}</span>
    </button>
  );
}

export function DSActivityRow({ title, detail, timestamp, actionLabel, onAction, className }: { title: string; detail?: string; timestamp: string; actionLabel?: string; onAction?: () => void; className?: string }) {
  return (
    <div className={cn('flex min-h-[length:var(--min-touch-target)] items-center gap-3 px-5 font-body', className)}>
      <div className="flex-1">
        <div className="text-base font-semibold text-ink">{title}</div>
        {detail && <div className="text-sm text-ink-muted text-ink-muted">{detail}</div>}
      </div>
      <div className="text-right">
        <div className="text-sm text-ink-muted text-ink-muted">{timestamp}</div>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="min-h-[length:var(--min-touch-target)] min-w-[length:var(--min-touch-target)] border-0 bg-transparent font-body text-sm text-ink-muted font-semibold text-primary cursor-pointer">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export interface DSMultilineFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export function DSMultilineField({ label, maxLength = 500, showCharacterCount = true, value = '', className, ...props }: DSMultilineFieldProps) {
  const len = String(value).length;
  return (
    <label className="flex flex-col gap-1.5 font-body">
      {label && <span className="label-text text-ink-body text-ink-body">{label}</span>}
      <textarea
        {...props}
        value={value}
        maxLength={maxLength}
        className={cn('min-h-24 rounded-control border border-line bg-card p-3 font-body text-base text-ink resize-y', className)}
      />
      {showCharacterCount && <span className="text-right text-sm text-ink-muted text-ink-muted">{len}/{maxLength}</span>}
    </label>
  );
}

export function DSPatternsGallery() {
  const snackbar = useDSSnackbarPresenter();
  const [week, setWeek] = React.useState('fri');
  const [preset, setPreset] = React.useState('5');
  const [step, setStep] = React.useState(3);
  const [mark, setMark] = React.useState(true);
  const [notes, setNotes] = React.useState('Sample note.');
  return (
    <section className="flex flex-col gap-3 font-body">
      <h3 className="m-0 label-text text-ink-body font-semibold text-ink">Patterns</h3>
      <button type="button" className="text-left text-sm text-ink-muted text-primary" onClick={() => snackbar.show('Item added', { actionLabel: 'Undo', onAction: () => {} })}>
        Show snackbar
      </button>
      <DSWeekStrip days={[{ id: 'mon', weekdaySymbol: 'M', dayNumber: 15, loadCount: 3 }, { id: 'fri', weekdaySymbol: 'F', dayNumber: 19, loadCount: 4 }]} selectedDayId={week} todayDayId="fri" onSelect={(d) => setWeek(d.id)} />
      <DSTimelineRow timeStart="09:30" timeEnd="10:30" state="live"><strong className="text-xl">Morning session</strong></DSTimelineRow>
      <div className="flex gap-3"><DSCountPill symbol="#" count={42} /><DSMarkToggle checked={mark} onCheckedChange={setMark} aria-label="Mark toggle" /></div>
      <DSSummaryBar items={[{ label: 'Done', value: '7', tone: 'success' }, { label: 'Pending', value: '1', tone: 'error' }, { label: 'Average', value: '92%' }]} />
      <DSPresetGrid options={[{ id: '1', label: '+1' }, { id: '5', label: '+5' }]} selectedId={preset} onSelect={(o) => setPreset(o.id)} />
      <DSStepper value={step} min={1} max={99} onChange={setStep} />
      <DSMultilineField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </section>
  );
}

export function DSPatternsGalleryWithHost() {
  return (
    <DSSnackbarHost>
      <DSPatternsGallery />
    </DSSnackbarHost>
  );
}
