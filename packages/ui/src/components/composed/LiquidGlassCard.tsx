import * as React from 'react';
import { cn } from '../../utils';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: number;
  opacity?: number;
}

export function LiquidGlassCard({
  className,
  children,
  blur = 20,
  opacity = 0.7,
  ...props
}: LiquidGlassCardProps) {
  return (
    <div
      className={cn('rounded-[16px] p-6 shadow-ambient', className)}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
