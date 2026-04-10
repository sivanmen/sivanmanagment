import * as React from 'react';
import { cn } from '../../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-medium font-body uppercase tracking-wider text-[#46464c]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#46464c]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-[8px] bg-white px-4 py-2 text-sm font-body text-[#191c1d] transition-all duration-200',
              'border border-[#c7c5cd]/20',
              'placeholder:text-[#46464c]/50',
              'focus:border-[#6b38d4] focus:outline-none focus:ring-1 focus:ring-[#6b38d4]/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/30',
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#ba1a1a] font-body">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
