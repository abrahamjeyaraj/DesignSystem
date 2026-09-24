'use client';

import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import type * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from './cn';

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterPillMenuProps {
  options: FilterOption[];
  selectedOption: FilterOption;
  onSelect: (option: FilterOption) => void;
  className?: string;
  showIcon?: boolean;
}

/**
 * FilterPillMenu - iOS-style filter dropdown pill
 *
 * A pill-shaped button that opens a dropdown menu for selecting filter options.
 * Shows the currently selected option and a checkmark next to it in the menu.
 */
export function FilterPillMenu({
  options,
  selectedOption,
  onSelect,
  className,
  showIcon = true,
}: FilterPillMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-full',
            'text-sm font-medium',
            'bg-subtle border border-line',
            'text-ink',
            'hover:bg-line-hover',
            'hover:border-action',
            'focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2',
            'transition-all duration-200',
            className
          )}
        >
          {showIcon && <SlidersHorizontal className="h-4 w-4" />}
          <span>{selectedOption.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onSelect(option)}
            className={cn(
              'flex items-center justify-between gap-3 cursor-pointer',
              selectedOption.id === option.id && 'bg-accent/50'
            )}
          >
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
            {selectedOption.id === option.id && <Check className="h-4 w-4 text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
