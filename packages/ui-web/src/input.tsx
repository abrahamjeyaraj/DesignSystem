import * as React from 'react';

import { cn } from './cn';

/**
 * Input - Form input component
 *
 * Accessibility requirements:
 * - ALWAYS pair with a Label component using matching id/htmlFor attributes
 * - For inputs without visible labels, provide aria-label
 * - Use aria-describedby for error messages or helper text
 * - Ensure proper input type for better mobile keyboard support
 *
 * @example
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-control border border-line bg-subtle px-3 py-2 text-base text-ink ring-offset-subtle file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
