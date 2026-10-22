import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — the brand's action language.
 * Orange = primary action. Navy outline = secondary. Green = confirm/positive.
 * Destructive actions use a navy-ink outline, never a red (MASTERPLAN 2.1).
 *
 * Every filled variant is a raised 3D object: a gradient face, a darker lip
 * under it, a lift on hover and a press on click. Ghost stays flat, because a
 * text action with a shadow reads as a button to push.
 */
const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill font-sans font-semibold transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-[#F98A4B] to-oriel-orange text-oriel-white shadow-[0_3px_0_#D9541A,0_6px_12px_rgba(10,23,51,0.18)] hover:from-[#FB9A60] hover:shadow-[0_5px_0_#D9541A,0_10px_18px_rgba(10,23,51,0.22)] active:shadow-[0_1px_0_#D9541A,0_3px_6px_rgba(10,23,51,0.16)]',
        confirm:
          'bg-gradient-to-b from-[#5FBE51] to-oriel-green text-oriel-white shadow-[0_3px_0_#2E7D28,0_6px_12px_rgba(10,23,51,0.18)] hover:from-[#6ECB5E] hover:shadow-[0_5px_0_#2E7D28,0_10px_18px_rgba(10,23,51,0.22)] active:shadow-[0_1px_0_#2E7D28,0_3px_6px_rgba(10,23,51,0.16)]',
        outline:
          'border border-oriel-navy bg-gradient-to-b from-oriel-white to-oriel-mist text-oriel-navy shadow-[0_3px_0_rgba(10,42,107,0.22),0_6px_12px_rgba(10,23,51,0.12)] hover:from-oriel-white hover:to-oriel-white hover:shadow-[0_5px_0_rgba(10,42,107,0.22),0_10px_18px_rgba(10,23,51,0.16)] active:shadow-[0_1px_0_rgba(10,42,107,0.22),0_3px_6px_rgba(10,23,51,0.12)]',
        'outline-light':
          'border border-oriel-white/70 bg-white/10 text-oriel-white shadow-[0_3px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(6,26,70,0.4)] hover:bg-oriel-white hover:text-oriel-navy hover:shadow-[0_5px_0_rgba(255,255,255,0.3),0_10px_18px_rgba(6,26,70,0.45)] active:shadow-[0_1px_0_rgba(255,255,255,0.25),0_3px_6px_rgba(6,26,70,0.35)]',
        whatsapp:
          'border border-oriel-green-deep bg-oriel-white text-oriel-green-deep shadow-[0_3px_0_rgba(46,125,40,0.28),0_6px_12px_rgba(10,23,51,0.12)] hover:bg-oriel-green-soft hover:shadow-[0_5px_0_rgba(46,125,40,0.28),0_10px_18px_rgba(10,23,51,0.16)] active:shadow-[0_1px_0_rgba(46,125,40,0.28),0_3px_6px_rgba(10,23,51,0.12)]',
        'whatsapp-solid':
          'bg-gradient-to-b from-[#3B9134] to-oriel-green-deep text-oriel-white shadow-[0_3px_0_#1F5A1B,0_6px_12px_rgba(10,23,51,0.2)] hover:from-[#43A03B] hover:shadow-[0_5px_0_#1F5A1B,0_10px_18px_rgba(10,23,51,0.24)] active:shadow-[0_1px_0_#1F5A1B,0_3px_6px_rgba(10,23,51,0.18)]',
        ghost:
          'text-oriel-navy shadow-none hover:translate-y-0 hover:bg-oriel-mist hover:shadow-none',
        destructive:
          'border border-oriel-navy-ink bg-gradient-to-b from-oriel-white to-oriel-mist text-oriel-navy-ink shadow-[0_3px_0_rgba(10,23,51,0.2),0_6px_12px_rgba(10,23,51,0.1)] hover:to-oriel-mist hover:shadow-[0_5px_0_rgba(10,23,51,0.2),0_10px_18px_rgba(10,23,51,0.14)] active:shadow-[0_1px_0_rgba(10,23,51,0.2),0_3px_6px_rgba(10,23,51,0.1)]',
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
