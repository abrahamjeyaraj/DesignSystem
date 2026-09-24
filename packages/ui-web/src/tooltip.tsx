import * as React from 'react';
import { cn } from './cn';

export interface TooltipProps {
  children: React.ReactElement;
  content: string;
  className?: string;
}

/**
 * Tooltip - A simple tooltip component using native HTML title attribute
 *
 * This is a lightweight tooltip implementation that uses the browser's
 * native tooltip functionality. For more advanced tooltips with custom
 * positioning and styling, consider using @radix-ui/react-tooltip.
 *
 * Usage:
 * <Tooltip content="This feature is coming soon!">
 *   <Button>Click me</Button>
 * </Tooltip>
 */
export function Tooltip({ children, content, className }: TooltipProps) {
  // Clone the child element and add the title attribute
  // Using proper typing to allow title attribute on React element
  const childProps = children.props as React.HTMLAttributes<HTMLElement>;
  return React.cloneElement(children, {
    title: content,
    className: cn(childProps.className, className),
  } as React.HTMLAttributes<HTMLElement>);
}

export interface TooltipWrapperProps extends React.HTMLAttributes<HTMLSpanElement> {
  tooltip: string;
}

/**
 * TooltipWrapper - A wrapper component for adding tooltips to any content
 *
 * Usage:
 * <TooltipWrapper tooltip="This feature is coming soon!">
 *   <span>Some content</span>
 * </TooltipWrapper>
 */
export function TooltipWrapper({ children, tooltip, className, ...props }: TooltipWrapperProps) {
  return (
    <span title={tooltip} className={cn('cursor-help', className)} {...props}>
      {children}
    </span>
  );
}
