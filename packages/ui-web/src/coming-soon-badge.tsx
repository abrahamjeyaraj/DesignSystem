import type * as React from 'react';
import { cn } from './cn';

export interface ComingSoonBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'subtle';
}

/**
 * ComingSoonBadge - A reusable badge to indicate features under development
 *
 * Usage:
 * - Default variant: More prominent, amber color scheme
 * - Subtle variant: More muted, gray color scheme for less emphasis
 */
export function ComingSoonBadge({
  variant = 'default',
  className,
  ...props
}: ComingSoonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variant === 'default'
          ? 'bg-action/25 text-ink border border-action'
          : 'bg-subtle text-ink/70 border border-line',
        className
      )}
      {...props}
    >
      Coming Soon
    </span>
  );
}
