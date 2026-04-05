"use client";
// src/components/ErixErrorBoundary.tsx
import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  error: Error | null;
}

interface ErixErrorBoundaryProps {
  moduleName:   string;
  fallback?:    (error: Error, reset: () => void) => React.ReactNode;
  children:     React.ReactNode;
}

export class ErixErrorBoundary extends React.Component<ErixErrorBoundaryProps, State> {
  constructor(props: ErixErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Non-blocking error report
    console.error(`[ErixErrorBoundary] Module: ${this.props.moduleName}`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultModuleError error={error} moduleName={this.props.moduleName} onReset={this.reset} />;
  }
}

// ── Default error UI ──────────────────────────────────────────────────────────
function DefaultModuleError({
  error,
  moduleName,
  onReset,
}: {
  error:      Error;
  moduleName: string;
  onReset:    () => void;
}) {
  return (
    <div className="erix-flex erix-flex-col erix-items-center erix-justify-center erix-h-full erix-min-h-[240px] erix-gap-4 erix-p-8 erix-text-center">
      <div className="erix-flex erix-items-center erix-justify-center erix-w-14 erix-h-14 erix-rounded-full erix-bg-destructive/10">
        <AlertTriangle className="erix-text-destructive" size={26} />
      </div>

      <div className="erix-space-y-1">
        <p className="erix-text-base erix-font-semibold erix-text-foreground">
          Something went wrong
        </p>
        <p className="erix-text-sm erix-text-muted-foreground">
          Failed to load the <span className="erix-font-medium erix-capitalize">{moduleName}</span> module.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="erix-text-xs erix-text-destructive erix-mt-2 erix-font-mono">
            {error.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="erix-inline-flex erix-items-center erix-gap-2 erix-px-4 erix-py-2 erix-rounded-md erix-text-sm erix-font-medium erix-bg-primary erix-text-primary-foreground hover:erix-bg-primary/90 erix-transition-colors"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
