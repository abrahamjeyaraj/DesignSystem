import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from './cn';

// Filled action CTA, outlined hairline secondary. Label font, case, tracking and weight come from the theme
// (label-text), and the shape from radius.button: a theme can make this a mono uppercase label or a pill.
const label = 'label-text text-[length:var(--label-size)]';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: `${label} bg-action text-action-foreground hover:bg-action/80`,
        destructive: `${label} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
        outline: `${label} border border-line bg-transparent text-ink hover:bg-subtle`,
        secondary: `${label} bg-subtle text-ink hover:bg-line`,
        ghost: `${label} text-ink hover:bg-subtle`,
        link: 'font-body text-sm text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[44px] h-11 px-5 py-2',
        sm: 'min-h-[40px] h-10 px-4',
        lg: 'min-h-[48px] h-12 px-8',
        icon: 'min-h-[44px] min-w-[44px] h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
