import * as React from 'react';
import { cn } from '../../utils';

/* ------------------------------------------------------------------ */
/*  Base pulse block                                                   */
/* ------------------------------------------------------------------ */

interface SkeletonBlockProps {
  className?: string;
}

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonCard                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-white p-5 shadow-ambient',
        className,
      )}
    >
      {/* Header area */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-32" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-full" />
      </div>

      {/* Body lines */}
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonTable                                                      */
/* ------------------------------------------------------------------ */

interface SkeletonTableProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ className, rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[16px] bg-white shadow-ambient',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex gap-4 border-b border-[#c7c5cd]/20 px-5 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'flex gap-4 px-5 py-4',
            rowIdx < rows - 1 && 'border-b border-[#c7c5cd]/10',
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonBlock
              key={colIdx}
              className={cn(
                'h-3 flex-1',
                colIdx === 0 && 'max-w-[140px]',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonList                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonListProps {
  className?: string;
  items?: number;
}

export function SkeletonList({ className, items = 5 }: SkeletonListProps) {
  return (
    <div
      className={cn(
        'divide-y divide-[#c7c5cd]/10 rounded-[16px] bg-white shadow-ambient',
        className,
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-2/5" />
            <SkeletonBlock className="h-3 w-3/5" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonForm                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonFormProps {
  className?: string;
  fields?: number;
}

export function SkeletonForm({ className, fields = 4 }: SkeletonFormProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-white p-6 shadow-ambient',
        className,
      )}
    >
      <SkeletonBlock className="mb-6 h-6 w-48" />

      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-[8px]" />
          </div>
        ))}
      </div>

      {/* Submit button area */}
      <div className="mt-8 flex justify-end gap-3">
        <SkeletonBlock className="h-10 w-24 rounded-[8px]" />
        <SkeletonBlock className="h-10 w-32 rounded-[8px]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonDashboard                                                  */
/* ------------------------------------------------------------------ */

interface SkeletonDashboardProps {
  className?: string;
}

export function SkeletonDashboard({ className }: SkeletonDashboardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stat cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-[16px] bg-white p-6 shadow-ambient">
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-8 w-28 rounded-[8px]" />
        </div>
        <SkeletonBlock className="h-64 w-full rounded-lg" />
      </div>

      {/* Table area */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}
