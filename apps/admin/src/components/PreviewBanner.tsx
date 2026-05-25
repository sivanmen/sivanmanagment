import React from 'react';

export type PreviewVariant = 'preview' | 'coming-soon' | 'degraded';

export interface PreviewBannerProps {
  variant?: PreviewVariant;
  label?: string;
  description?: string;
  className?: string;
}

const VARIANT_STYLES: Record<PreviewVariant, {
  bg: string;
  border: string;
  dot: string;
  text: string;
  defaultLabel: string;
}> = {
  preview: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    defaultLabel: 'Preview — backend not yet connected',
  },
  'coming-soon': {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    defaultLabel: 'Coming soon',
  },
  degraded: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
    defaultLabel: 'Limited — required API key not configured',
  },
};

/**
 * Banner shown at the top of pages whose backend is a mock or whose
 * integration is unconfigured. Prevents the user from believing data on
 * screen is real. Sivan Obsidian glass-tinted style.
 */
export function PreviewBanner({
  variant = 'preview',
  label,
  description,
  className = '',
}: PreviewBannerProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 rounded-lg border backdrop-blur-sm px-4 py-3 flex items-start gap-3 ${styles.bg} ${styles.border} ${className}`}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 rounded-full animate-pulse ${styles.dot}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${styles.text}`}>
          {label ?? styles.defaultLabel}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-white/60">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
