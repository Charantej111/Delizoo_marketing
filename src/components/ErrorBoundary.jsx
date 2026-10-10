import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Delizoo OS ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/overview';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="card-modern max-w-md w-full p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-xl border border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Something went wrong in this view
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                An unexpected interface error occurred. Your capital ledger data is safe in Supabase.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[11px] font-mono text-left bg-zinc-100 dark:bg-zinc-900/80 p-3 rounded-xl overflow-x-auto text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-800 max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary text-xs flex items-center gap-2 px-4 py-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover & Reset View</span>
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/overview'; }}
                className="btn-secondary text-xs flex items-center gap-2 px-4 py-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
