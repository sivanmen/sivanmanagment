import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-body transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#e9ddff] text-[#6b38d4]',
        success: 'bg-[#e8f5e9] text-[#2e7d32]',
        warning: 'bg-[#fff3e0] text-[#ed6c02]',
        error: 'bg-[#ffdad6] text-[#ba1a1a]',
        outline: 'border border-[#c7c5cd]/30 text-[#46464c]',
        pulse: 'bg-[#8455ef]/20 text-[#6b38d4] animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
