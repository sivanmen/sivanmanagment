import * as React from 'react';
import { cn } from '../../utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  sublabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  sublabel,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-white p-5 shadow-ambient transition-all duration-200 hover:shadow-ambient-lg',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-body uppercase tracking-wider text-[#46464c]">{label}</p>
          <p className="text-2xl font-bold font-headline text-[#191c1d]">{value}</p>
          <div className="flex items-center gap-2">
            {change && (
              <span
                className={cn(
                  'text-xs font-medium',
                  changeType === 'positive' && 'text-[#2e7d32]',
                  changeType === 'negative' && 'text-[#ba1a1a]',
                  changeType === 'neutral' && 'text-[#46464c]',
                )}
              >
                {change}
              </span>
            )}
            {sublabel && <span className="text-xs text-[#46464c]">{sublabel}</span>}
          </div>
        </div>
        {icon && <div className="text-[#6b38d4]">{icon}</div>}
      </div>
    </div>
  );
}
