import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Dharitri Sentu Application Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-warmivory">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-700">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-maintext font-serif mb-2">
              Temporary Render Notice
            </h2>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Dharitri Sentu encountered an unexpected interface condition. Your secure session and stored land records remain protected and intact.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mb-6 p-3 bg-stone-50 rounded-xl text-left border border-stone-200 overflow-x-auto text-xs font-mono text-stone-700">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-evergreen text-white text-xs font-semibold hover:bg-forest transition shadow-sm"
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 transition"
              >
                <Home size={14} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
