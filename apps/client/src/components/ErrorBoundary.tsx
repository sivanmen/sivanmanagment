import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-on-surface font-heading mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-on-surface text-sm font-medium hover:bg-surface-variant/50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>

            {this.state.error && (
              <div className="text-start">
                <button
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                  className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors mx-auto"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {this.state.showDetails ? 'Hide' : 'Show'} error details
                </button>
                {this.state.showDetails && (
                  <div className="mt-3 p-4 rounded-xl bg-surface-variant/30 border border-border text-start overflow-auto max-h-48">
                    <p className="text-xs font-mono text-red-400 mb-2">{this.state.error.message}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[10px] font-mono text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
