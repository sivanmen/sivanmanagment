import * as React from 'react';
import { cn } from '../../utils';
import type { LucideIcon } from 'lucide-react';

type IllustrationVariant = 'default' | 'search' | 'error' | 'inbox';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: IllustrationVariant;
  className?: string;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  SVG illustration per variant                                       */
/* ------------------------------------------------------------------ */

function Illustration({ variant }: { variant: IllustrationVariant }) {
  const base = 'mx-auto mb-4 h-32 w-32 text-[#c7c5cd]';

  switch (variant) {
    case 'search':
      return (
        <svg className={base} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="54" cy="54" r="30" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <line x1="76" y1="76" x2="104" y2="104" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          <circle cx="54" cy="54" r="12" stroke="#6b38d4" strokeWidth="2" opacity="0.4" />
        </svg>
      );
    case 'error':
      return (
        <svg className={base} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <path d="M50 50l28 28M78 50L50 78" stroke="#ba1a1a" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case 'inbox':
      return (
        <svg className={base} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="38" width="72" height="52" rx="6" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <path d="M28 60h24l8 12h8l8-12h24" stroke="#6b38d4" strokeWidth="2" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg className={base} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="24" y="36" width="80" height="56" rx="8" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <circle cx="64" cy="64" r="12" stroke="#6b38d4" strokeWidth="2" opacity="0.4" />
          <path d="M64 56v16M56 64h16" stroke="#6b38d4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  EmptyState component                                               */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      {/* Illustration */}
      {illustration && <Illustration variant={illustration} />}

      {/* Icon (used when no illustration) */}
      {Icon && !illustration && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f5]">
          <Icon className="h-8 w-8 text-[#46464c]" strokeWidth={1.5} />
        </div>
      )}

      {/* Title */}
      <h3 className="mb-1 font-headline text-lg font-semibold text-[#191c1d]">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-sm text-[#46464c]">{description}</p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-[8px] bg-gradient-to-br from-[#6b38d4] to-[#8455ef] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}

      {/* Custom children */}
      {children}
    </div>
  );
}
