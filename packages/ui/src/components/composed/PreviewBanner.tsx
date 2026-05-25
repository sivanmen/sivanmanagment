import React from 'react';
import { cn } from '../../utils';

export interface PreviewBannerProps {
  /**
   * Type of preview/mock status.
   * - `preview`: feature exists in UI but backend returns mock data
   * - `coming-soon`: feature is on the roadmap, UI is a placeholder
   * - `degraded`: feature works but external integration missing (e.g. WhatsApp without API key)
   */
  variant?: 'preview' | 'coming-soon' | 'degraded';
  /** Optional override label. If omitted, a sensible default is used per variant. */
  label?: string;
  /** Optional secondary line of context, e.g. "Connect Anthropic API key in Settings to enable." */
  description?: string;
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<PreviewBannerProps['variant']>, {
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
 * Banner shown at the top of pages whose backend is a mock or whose integration
 * is unconfigured. Prevents the user from believing data on screen is real.
 *
 * Sivan Obsidian style: glass tint over the page accent color, no full-bleed
 * coverage so the surrounding layout stays intact.
 */
export function PreviewBanner({
  variant = 'preview',
  label,
  description,
  className,
}: PreviewBannerProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-4 rounded-lg border backdrop-blur-sm px-4 py-3 flex items-start gap-3',
        styles.bg,
        styles.border,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('mt-1.5 h-2 w-2 rounded-full animate-pulse', styles.dot)}
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', styles.text)}>
          {label ?? styles.defaultLabel}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-white/60">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
