/**
 * Horizontal tab bar with active border-bottom, optional count badges.
 * Generic over the tab key type so callers get type-safe `onChange`.
 */

import type { ReactNode } from 'react';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  badge?: ReactNode;
}

export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <nav
      className={`flex border-b border-line px-[24px] md:px-[40px] lg:px-[80px] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-[8px] px-[20px] py-[14px] label-text text-[12px] transition-colors md:px-[28px] ${
              isActive ? 'border-b-2 border-ink text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="rounded-full bg-ink px-[6px] py-[1px] text-[10px] text-subtle">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
