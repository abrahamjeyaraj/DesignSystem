'use client';
import * as React from 'react';

export interface DSSnackbarBarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function DSSnackbarBar({ message, actionLabel, onAction, className }: DSSnackbarBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-ink-900)',
        color: 'var(--color-on-ink)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} style={{ minWidth: 48, minHeight: 48, border: 0, background: 'transparent', color: 'var(--color-on-ink-accent)', fontWeight: 600, cursor: 'pointer' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export interface DSWeekStripDay { id: string; weekdaySymbol: string; dayNumber: number; loadCount?: number }
export function DSWeekStrip({ days, selectedDayId, todayDayId, onSelect }: { days: DSWeekStripDay[]; selectedDayId: string; todayDayId?: string; onSelect: (d: DSWeekStripDay) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {days.map((day) => {
        const selected = day.id === selectedDayId;
        const isToday = day.id === todayDayId;
        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(day)}
            style={{
              flex: 1,
              border: isToday && !selected ? '1px solid var(--color-primary)' : '0',
              borderRadius: 14,
              padding: '10px 0',
              background: selected ? 'var(--color-action)' : 'var(--color-card)',
              color: selected ? 'var(--color-action-foreground)' : 'var(--color-foreground)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, color: selected ? 'inherit' : 'var(--color-ink-muted)' }}>{day.weekdaySymbol}</div>
            <div style={{ fontWeight: 600 }}>{day.dayNumber}</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', height: 4 }}>
              {Array.from({ length: Math.min(day.loadCount ?? 0, 4) }).map((_, i) => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: selected ? 'currentColor' : 'var(--color-accent-2)' }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function DSTimelineRow({ timeStart, timeEnd, state, children, footer }: { timeStart: string; timeEnd: string; state: 'past' | 'live' | 'upcoming'; children: React.ReactNode; footer?: React.ReactNode }) {
  const live = state === 'live';
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ width: 44, paddingTop: 14 }}>
        <div style={{ fontWeight: 600 }}>{timeStart}</div>
        <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{timeEnd}</div>
      </div>
      <div style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-xl)', background: live ? 'var(--color-ink-900)' : 'var(--color-card)', border: live ? 'none' : '1px solid var(--color-border)', color: live ? 'var(--color-on-ink)' : 'var(--color-foreground)' }}>
        {children}
        {footer}
      </div>
    </div>
  );
}

export function DSCountPill({ symbol, count, onClick, 'aria-label': ariaLabel }: { symbol: string; count: number; onClick?: () => void; 'aria-label'?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? `${symbol} ${count}`} style={{ height: 36, padding: '0 12px', borderRadius: 9999, border: 0, background: 'var(--color-muted)', cursor: 'pointer', fontWeight: 600 }}>
      {symbol} {count}
    </button>
  );
}

export function DSPodium({ entries, renderAvatar }: { entries: { id: string; name: string; value: string; height: number; leader?: boolean }[]; renderAvatar: (id: string) => React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      {entries.map((e) => (
        <div key={e.id} style={{ flex: 1, height: e.height, padding: '14px 8px', borderRadius: 'var(--radius-xl)', background: e.leader ? 'var(--color-ink-900)' : 'var(--color-card)', border: e.leader ? 'none' : '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6, color: e.leader ? 'var(--color-on-ink)' : 'var(--color-foreground)' }}>
          {renderAvatar(e.id)}
          <strong>{e.name}</strong>
          <span style={{ fontSize: 12, color: e.leader ? 'var(--color-on-ink-accent)' : 'var(--color-ink-muted)' }}>{e.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DSMarkToggle({ checked, onCheckedChange, 'aria-label': ariaLabel = 'Attendance mark' }: { checked: boolean; onCheckedChange: (v: boolean) => void; 'aria-label'?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={ariaLabel} onClick={() => onCheckedChange(!checked)} style={{ width: 48, height: 48, borderRadius: 9999, border: 0, background: checked ? 'var(--color-success-light)' : 'var(--color-error)', cursor: 'pointer', fontSize: 22, color: checked ? 'var(--color-success)' : 'var(--color-destructive-foreground)' }}>
      {checked ? '✓' : '✕'}
    </button>
  );
}

export function DSSummaryBar({ items }: { items: { label: string; value: string; tone?: 'success' | 'error' }[] }) {
  return (
    <div style={{ display: 'flex', padding: '14px 0', borderRadius: 'var(--radius-xl)', background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      {items.map((item) => (
        <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: item.tone === 'success' ? 'var(--color-success)' : item.tone === 'error' ? 'var(--color-error)' : 'var(--color-foreground)' }}>{item.value}</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DSPresetGrid({ options, selectedId, onSelect }: { options: { id: string; label: string }[]; selectedId?: string; onSelect: (o: { id: string; label: string }) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {options.map((o) => {
        const selected = o.id === selectedId;
        return (
          <button key={o.id} type="button" aria-pressed={selected} onClick={() => onSelect(o)} style={{ flex: 1, height: 64, borderRadius: 'var(--radius-xl)', border: selected ? 0 : '1px solid var(--color-border)', background: selected ? 'var(--color-action)' : 'var(--color-card)', color: selected ? 'var(--color-action-foreground)' : 'var(--color-foreground)', fontWeight: 600, cursor: 'pointer' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DSStepper({ value, min, max, onChange, label = 'Value stepper' }: { value: number; min: number; max: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div aria-label={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(value - 1)} style={{ width: 48, height: 48, border: 0, background: 'transparent', cursor: 'pointer' }}>−</button>
      <span>{value}</span>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)} style={{ width: 48, height: 48, border: 0, background: 'transparent', cursor: 'pointer' }}>+</button>
    </div>
  );
}

export function DSQuickActionTile({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 1, minHeight: 48, padding: '12px 0', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {icon}
      <span style={{ fontSize: 12, color: 'var(--color-ink-body)' }}>{title}</span>
    </button>
  );
}

export function DSActivityRow({ title, detail, timestamp, actionLabel, onAction }: { title: string; detail?: string; timestamp: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 20px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {detail && <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{detail}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{timestamp}</div>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} style={{ minWidth: 48, minHeight: 48, border: 0, background: 'transparent', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)' }}>
      {label && <span style={{ fontSize: 13, color: 'var(--color-ink-body)' }}>{label}</span>}
      <textarea
        {...props}
        value={value}
        maxLength={maxLength}
        className={className}
        style={{
          minHeight: 96,
          padding: 12,
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-card)',
          fontFamily: 'inherit',
          fontSize: 16,
          resize: 'vertical',
        }}
      />
      {showCharacterCount && <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', textAlign: 'right' }}>{len}/{maxLength}</span>}
    </label>
  );
}

export function PenV2Gallery() {
  const [week, setWeek] = React.useState('fri');
  const [preset, setPreset] = React.useState('5');
  const [step, setStep] = React.useState(3);
  const [mark, setMark] = React.useState(true);
  const [notes, setNotes] = React.useState('Great progress.');
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-body)' }}>Pen v2</h3>
      <DSSnackbarBar message="Ananya +1 ★" actionLabel="Undo" onAction={() => {}} />
      <DSWeekStrip days={[{ id: 'mon', weekdaySymbol: 'M', dayNumber: 15, loadCount: 3 }, { id: 'fri', weekdaySymbol: 'F', dayNumber: 19, loadCount: 4 }]} selectedDayId={week} todayDayId="fri" onSelect={(d) => setWeek(d.id)} />
      <DSTimelineRow timeStart="09:30" timeEnd="10:30" state="live"><strong>Class 10 · Morning</strong></DSTimelineRow>
      <div style={{ display: 'flex', gap: 12 }}><DSCountPill symbol="★" count={42} /><DSMarkToggle checked={mark} onCheckedChange={setMark} /></div>
      <DSSummaryBar items={[{ label: 'Present', value: '7', tone: 'success' }, { label: 'Absent', value: '1', tone: 'error' }, { label: 'Class avg', value: '92%' }]} />
      <DSPresetGrid options={[{ id: '1', label: '+1' }, { id: '5', label: '+5' }]} selectedId={preset} onSelect={(o) => setPreset(o.id)} />
      <DSStepper value={step} min={1} max={99} onChange={setStep} />
      <DSMultilineField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </section>
  );
}
