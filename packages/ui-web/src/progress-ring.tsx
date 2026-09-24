'use client';

import { cn } from './cn';

export type ProgressRingStatus =
  | 'on-track'
  | 'behind-mild'
  | 'behind-critical'
  | 'completed-today'
  | 'streak-milestone'
  | 'just-started'
  | 'almost-done'
  | 'plan-completed';

interface ProgressRingProps {
  percentage: number;
  status?: ProgressRingStatus;
  size?: 'sm' | 'md' | 'lg';
  showCheckmark?: boolean;
  className?: string;
}

// Editorial tier palette — tan/ink family. "behind-critical" keeps a restrained editorial red.
const statusColors: Record<ProgressRingStatus, { ring: string; bg: string; text: string }> = {
  'on-track': {
    ring: 'stroke-ink',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
  'behind-mild': {
    ring: 'stroke-action',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
  'behind-critical': {
    ring: 'stroke-destructive',
    bg: 'bg-subtle',
    text: 'text-destructive',
  },
  'completed-today': {
    ring: 'stroke-ink',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
  'streak-milestone': {
    ring: 'stroke-action',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
  'just-started': {
    ring: 'stroke-line',
    bg: 'bg-subtle',
    text: 'text-ink/60',
  },
  'almost-done': {
    ring: 'stroke-ink',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
  'plan-completed': {
    ring: 'stroke-action',
    bg: 'bg-subtle',
    text: 'text-ink',
  },
};

const sizeConfig = {
  sm: { dimension: 40, strokeWidth: 3, fontSize: 'text-xs', innerSize: 32 },
  md: { dimension: 52, strokeWidth: 4, fontSize: 'text-sm', innerSize: 42 },
  lg: { dimension: 64, strokeWidth: 5, fontSize: 'text-base', innerSize: 52 },
};

export function ProgressRing({
  percentage,
  status = 'on-track',
  size = 'sm',
  showCheckmark = false,
  className,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const colors = statusColors[status];

  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = config.dimension / 2;

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: config.dimension, height: config.dimension }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={config.dimension}
        height={config.dimension}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-line"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={cn(colors.ring, 'transition-all duration-500 ease-out')}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Inner content */}
      <div
        className={cn('absolute rounded-full flex items-center justify-center', colors.bg)}
        style={{ width: config.innerSize, height: config.innerSize }}
      >
        {showCheckmark ? (
          <svg
            className={cn('w-4 h-4', colors.text)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            role="img"
            aria-label="Complete"
          >
            <title>Complete</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className={cn('font-bold', config.fontSize, colors.text)}>{percentage}%</span>
        )}
      </div>
    </div>
  );
}
