import React, { Component, ErrorInfo, ReactNode } from "react";
import { getLogger, ILogger, LoggerManager } from "../../lib/logger";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "./Button";

export interface GameErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  logger?: ILogger;
}

export interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

/**
 * Resilient React Error Boundary catching render lifecycle exceptions.
 * Logs fatal errors via ILogger and presents an in-game recovery interface.
 * Adheres to SRP & DIP.
 */
export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  private readonly logger: ILogger;

  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: null,
      copied: false,
    };
    this.logger = props.logger || getLogger("component:error-boundary");
  }

  public static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.logger.fatal(
      `Uncaught React component render crash: ${error.message || "Unknown error"}`,
      {
        componentStack: errorInfo.componentStack,
      },
      error
    );
  }

  private handleRetry = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {
        // Ignore reset failures
      }
    }
    this.setState({
      hasError: false,
      error: null,
      componentStack: null,
      copied: false,
    });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleCopyDiagnosticLog = async () => {
    try {
      const ringBuffer = LoggerManager.getInstance().ringBuffer;
      const logs = ringBuffer.exportAsText();
      const diagnosticReport = [
        "=== VIBRANT CASTLE CRASH REPORT ===",
        `Timestamp: ${new Date().toISOString()}`,
        `Error: ${this.state.error?.name || "Error"}: ${this.state.error?.message || "Unknown"}`,
        `Stack: ${this.state.error?.stack || "No stack"}`,
        `Component Stack: ${this.state.componentStack || "No component stack"}`,
        "\n=== RECENT GAME LOGS ===",
        logs || "No logs in ring buffer",
      ].join("\n");

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(diagnosticReport);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (err) {
      this.logger.error("Failed to copy diagnostic report to clipboard", undefined, err);
    }
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      fallbackTitle = "An Unexpected Castle Anomaly Occurred",
      fallbackMessage = "The interface encountered a fatal rendering failure. Your save data is safe.",
    } = this.props;

    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-[#0c0302] text-stone-200">
        <div className="max-w-xl w-full p-6 rounded-2xl bg-[#170603] border-2 border-red-900/60 shadow-2xl shadow-red-950/40 flex flex-col gap-4 text-center items-center font-sans">
          <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 animate-pulse">
            <AlertTriangle size={28} />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-red-300 tracking-wide uppercase font-serif">
              {fallbackTitle}
            </h2>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              {fallbackMessage}
            </p>
          </div>

          {this.state.error && (
            <div className="w-full text-left p-3 rounded-xl bg-[#090201] border border-red-950/80 text-[11px] font-mono text-red-200/90 overflow-x-auto max-h-32 custom-scrollbar">
              <span className="font-bold text-red-400">
                {this.state.error.name}:
              </span>{" "}
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={14} />}
              onClick={this.handleRetry}
            >
              Retry Interface
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={this.state.copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={this.handleCopyDiagnosticLog}
            >
              {this.state.copied ? "Report Copied!" : "Copy Diagnostic Log"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleReload}
              className="text-stone-400 hover:text-stone-200"
            >
              Reload Game
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
