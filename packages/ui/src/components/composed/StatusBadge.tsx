import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-body font-medium transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-[#e8f5e9] text-[#2e7d32]',
        warning: 'bg-[#fff3e0] text-[#ed6c02]',
        error: 'bg-[#ffdad6] text-[#ba1a1a]',
        info: 'bg-[#e3f2fd] text-[#1565c0]',
        neutral: 'bg-[#f3f4f5] text-[#46464c]',
        purple: 'bg-[#e9ddff] text-[#6b38d4]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
);

/* ------------------------------------------------------------------ */
/*  Status-to-variant mapping                                          */
/* ------------------------------------------------------------------ */

const statusMap: Record<string, VariantProps<typeof statusBadgeVariants>['variant']> = {
  // Success states
  active: 'success',
  confirmed: 'success',
  completed: 'success',
  paid: 'success',
  approved: 'success',
  available: 'success',
  online: 'success',
  resolved: 'success',

  // Warning states
  pending: 'warning',
  'in-progress': 'warning',
  in_progress: 'warning',
  processing: 'warning',
  draft: 'warning',
  review: 'warning',
  maintenance: 'warning',
  partial: 'warning',

  // Error states
  cancelled: 'error',
  canceled: 'error',
  rejected: 'error',
  failed: 'error',
  overdue: 'error',
  expired: 'error',
  inactive: 'error',
  offline: 'error',
  blocked: 'error',

  // Info states
  scheduled: 'info',
  'checked-in': 'info',
  checked_in: 'info',
  reserved: 'info',
  new: 'info',

  // Neutral states
  unknown: 'neutral',
  archived: 'neutral',
  paused: 'neutral',
};

/* ------------------------------------------------------------------ */
/*  Dot indicator sizes                                                */
/* ------------------------------------------------------------------ */

const dotSizes: Record<string, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Raw status string — auto-mapped to a color variant */
  status?: string;
  /** Show a leading colored dot */
  dot?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StatusBadge({
  className,
  variant,
  size = 'md',
  status,
  dot = false,
  children,
  ...props
}: StatusBadgeProps) {
  // Resolve variant: explicit prop wins, then auto-map from status string
  const resolvedVariant =
    variant ?? (status ? statusMap[status.toLowerCase()] ?? 'neutral' : 'neutral');

  return (
    <span
      className={cn(statusBadgeVariants({ variant: resolvedVariant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'shrink-0 rounded-full bg-current opacity-70',
            dotSizes[size ?? 'md'],
          )}
        />
      )}
      {children ?? status}
    </span>
  );
}
