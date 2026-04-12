import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-[16px] bg-white p-10 shadow-ambient',
            this.props.className,
          )}
        >
          {/* Illustration */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ffdad6]/50">
            <AlertTriangle className="h-10 w-10 text-[#ba1a1a]" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h2 className="mb-2 font-headline text-xl font-bold text-[#191c1d]">
            Something went wrong
          </h2>

          {/* Description */}
          <p className="mb-6 max-w-sm text-center text-sm text-[#46464c]">
            An unexpected error occurred. Please try again or contact support if the problem
            persists.
          </p>

          {/* Error details (collapsed) */}
          {this.state.error && (
            <details className="mb-6 w-full max-w-md">
              <summary className="cursor-pointer text-xs text-[#46464c] hover:text-[#191c1d]">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-[#f3f4f5] p-3 text-xs text-[#46464c]">
                {this.state.error.message}
              </pre>
            </details>
          )}

          {/* Retry button */}
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-[8px] bg-gradient-to-br from-[#6b38d4] to-[#8455ef] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
