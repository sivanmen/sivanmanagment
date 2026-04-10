import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-sm font-medium font-body transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-[#030303] to-[#1d1d1d] text-white hover:opacity-90 active:scale-[0.98]',
        accent:
          'bg-gradient-to-br from-[#6b38d4] to-[#8455ef] text-white hover:opacity-90 active:scale-[0.98]',
        secondary:
          'bg-white/60 backdrop-blur-lg text-[#191c1d] hover:bg-white/80 active:scale-[0.98]',
        outline:
          'border border-[#c7c5cd]/20 bg-transparent text-[#191c1d] hover:bg-[#f3f4f5]',
        ghost:
          'text-[#191c1d] hover:bg-[#f3f4f5]',
        link:
          'text-[#6b38d4] underline-offset-4 hover:underline p-0 h-auto',
        destructive:
          'bg-[#ba1a1a] text-white hover:bg-[#ba1a1a]/90',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
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
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
