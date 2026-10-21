import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — the brand's action language.
 * Orange = primary action. Navy outline = secondary. Green = confirm/positive.
 * Destructive actions use a navy-ink outline, never a red (MASTERPLAN 2.1).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input font-sans font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-oriel-orange text-oriel-white hover:bg-oriel-orange-deep',
        outline:
          'border border-oriel-navy text-oriel-navy bg-transparent hover:bg-oriel-navy hover:text-oriel-white',
        'outline-light':
          'border border-oriel-white/70 text-oriel-white bg-transparent hover:bg-oriel-white hover:text-oriel-navy',
        confirm: 'bg-oriel-green text-oriel-white hover:bg-oriel-green-deep',
        whatsapp:
          'border border-oriel-green-deep text-oriel-green-deep bg-transparent hover:bg-oriel-green-soft',
        ghost: 'text-oriel-navy hover:bg-oriel-mist',
        destructive:
          'border border-oriel-line text-oriel-navy-ink bg-transparent hover:bg-oriel-mist',
      },
      size: {
        sm: 'h-9 px-3 text-small',
        md: 'h-11 px-5 text-body',
        lg: 'h-12 px-7 text-body-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
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
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
