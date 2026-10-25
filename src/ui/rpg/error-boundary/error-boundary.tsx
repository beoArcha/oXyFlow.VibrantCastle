import React, { Component, ErrorInfo, ReactNode } from "react";
import { getLogger, ILogger } from "@lib/logger";
import {
  GameErrorContext,
  GameErrorContextValue,
} from "./error-state";
import { GameErrorContainer } from "./error-container";
import { GameErrorIcon } from "./error-icon";
import { GameErrorTitle } from "./error-title";
import { GameErrorDescription } from "./error-description";
import { GameErrorDetails } from "./error-details";
import { GameErrorActions } from "./error-actions";
import { GameErrorRetryButton } from "./error-retry-button";
import { GameErrorCopyButton } from "./error-copy-button";
import { GameErrorReloadButton } from "./error-reload-button";
import { DefaultGameErrorFallback } from "./default-error-fallback";

export interface GameErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((context: GameErrorContextValue) => ReactNode);
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  logger?: ILogger;
  className?: string;
  /** Optional diagnostic report generator function injected by application adapters */
  reportCollector?: (error: Error | null, componentStack: string | null) => Promise<string>;
}

export interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

interface ComponentUpdaterInternal {
  updater?: {
    isMounted?: (inst: unknown) => boolean;
  };
}

/**
 * Resilient React Error Boundary composite component.
 * Catches render exceptions, logs fatal crashes via ILogger, captures component stacks,
 * and renders either a custom fallback or a standard gothic crash recovery interface.
 */
export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  public static Container = GameErrorContainer;
  public static Icon = GameErrorIcon;
  public static Title = GameErrorTitle;
  public static Description = GameErrorDescription;
  public static Details = GameErrorDetails;
  public static Actions = GameErrorActions;
  public static RetryButton = GameErrorRetryButton;
  public static CopyButton = GameErrorCopyButton;
  public static ReloadButton = GameErrorReloadButton;
  public static DefaultFallback = DefaultGameErrorFallback;

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
    const internal = this as unknown as ComponentUpdaterInternal;
    const updater = internal.updater;
    if (updater && typeof updater.isMounted === "function" && updater.isMounted(this)) {
      this.setState({ componentStack: errorInfo.componentStack ?? null });
    } else {
      this.state = {
        ...this.state,
        componentStack: errorInfo.componentStack ?? null,
      };
    }

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
      let diagnosticReport: string;
      if (this.props.reportCollector) {
        diagnosticReport = await this.props.reportCollector(
          this.state.error,
          this.state.componentStack
        );
      } else {
        const err = this.state.error;
        diagnosticReport = [
          "=== APPLICATION CRASH REPORT ===",
          `Timestamp: ${new Date().toISOString()}`,
          `Error: ${err?.name || "Error"}: ${err?.message || "Unknown"}`,
          `Stack: ${err?.stack || "No stack"}`,
          `Component Stack: ${this.state.componentStack || "No component stack"}`,
        ].join("\n");
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(diagnosticReport);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (err) {
      this.logger.error("Failed to copy diagnostic report to clipboard", { action: "copy_diagnostic_report" }, err);
    }
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      fallback,
      fallbackTitle = "An Unexpected Castle Anomaly Occurred",
      fallbackMessage = "The interface encountered a fatal rendering failure. Your save data is safe.",
      className,
    } = this.props;

    const contextValue: GameErrorContextValue = {
      error: this.state.error,
      componentStack: this.state.componentStack,
      isCopied: this.state.copied,
      fallbackTitle,
      fallbackMessage,
      onRetry: this.handleRetry,
      onReload: this.handleReload,
      onCopyReport: this.handleCopyDiagnosticLog,
    };

    let content: ReactNode;
    if (typeof fallback === "function") {
      content = fallback(contextValue);
    } else if (fallback) {
      content = fallback;
    } else {
      content = <DefaultGameErrorFallback className={className} />;
    }

    return (
      <GameErrorContext.Provider value={contextValue}>
        {content}
      </GameErrorContext.Provider>
    );
  }
}

export const ErrorBoundary = GameErrorBoundary;
export type ErrorBoundaryProps = GameErrorBoundaryProps;
export default GameErrorBoundary;
