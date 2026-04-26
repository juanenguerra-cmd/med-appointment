import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
  eventId?: string;
};

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return String(value);
};

const buildEventId = () => `ERR-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function getSafeRuntimeSnapshot() {
  return {
    path: window.location.pathname,
    hash: window.location.hash,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

function persistRuntimeError(payload: Record<string, unknown>) {
  try {
    const key = 'med_appointment_runtime_errors_v1';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const next = Array.isArray(existing) ? existing.slice(-19) : [];
    next.push(payload);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Never allow logging to create another runtime failure.
  }
}

export function logRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  const eventId = buildEventId();
  const err = error instanceof Error ? error : new Error(safeString(error) || 'Unknown runtime error');
  const payload = {
    eventId,
    message: err.message,
    stack: err.stack,
    context,
    runtime: getSafeRuntimeSnapshot(),
  };

  persistRuntimeError(payload);
  console.error('[RuntimeError]', payload);
  return eventId;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error',
      errorStack: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const eventId = logRuntimeError(error, {
      source: 'ReactErrorBoundary',
      componentStack: errorInfo.componentStack,
    });

    this.setState({ eventId });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentFacilityId');
    } catch {
      // Ignore storage cleanup failures.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-6">
        <section className="w-full max-w-2xl rounded-3xl border border-[#d6deeb] bg-white shadow-xl overflow-hidden">
          <div className="bg-[#0b2a6f] text-white px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.22em] font-black opacity-80">Runtime Safety</p>
            <h1 className="text-2xl font-black tracking-tight mt-1">The app recovered from an unexpected error</h1>
            <p className="text-sm opacity-85 mt-2">Your data was not deleted. The error was saved locally for troubleshooting.</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-red-700 mb-1">Error Message</p>
              <p className="text-sm font-semibold text-red-900 break-words">{this.state.errorMessage || 'Unexpected application error'}</p>
              {this.state.eventId && (
                <p className="text-[11px] text-red-700 mt-2 font-mono">Event ID: {this.state.eventId}</p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 leading-relaxed">
              Try reloading first. If the same error returns, reset the current login/session and sign in again. This does not clear the facility database.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 rounded-full bg-[#0b2a6f] text-white px-5 py-3 text-sm font-black hover:opacity-90 transition-opacity"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="flex-1 rounded-full border border-[#d6deeb] bg-white text-[#0b2a6f] px-5 py-3 text-sm font-black hover:bg-slate-50 transition-colors"
              >
                Reset Session Only
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
}

export function installGlobalRuntimeLogging() {
  window.addEventListener('error', (event) => {
    logRuntimeError(event.error || event.message, {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logRuntimeError(event.reason, {
      source: 'window.unhandledrejection',
    });
  });
}
