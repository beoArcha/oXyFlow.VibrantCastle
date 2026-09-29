import React, { Component, ErrorInfo, ReactNode } from "react";
import { getLogger, ILogger, LoggerManager } from "@lib/logger";
import { GameBaseError } from "@lib/errors";
import {
  GameErrorContext,
  GameErrorContextValue,
  GameErrorContainer,
  GameErrorIcon,
  GameErrorTitle,
  GameErrorDescription,
  GameErrorDetails,
  GameErrorActions,
  GameErrorRetryButton,
  GameErrorCopyButton,
  GameErrorReloadButton,
  DefaultGameErrorFallback,
} from "./error-boundary/index";

export interface GameErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((context: GameErrorContextValue) => ReactNode);
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  logger?: ILogger;
  className?: string;
}

export interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

/**
 * Resilient React Error Boundary composite component.
 * Catches render exceptions, logs fatal crashes via ILogger, captures component stacks,
 * and renders either a custom fallback or a standard gothic crash recovery interface.
 *
 * @example Default usage
 * ```tsx
 * <GameErrorBoundary fallbackTitle="Castle Anomaly">
 *   <GameViewport />
 * </GameErrorBoundary>
 * ```
 *
 * @example Compound composition usage
 * ```tsx
 * <GameErrorBoundary
 *   fallback={
 *     <GameErrorBoundary.Container>
 *       <GameErrorBoundary.Icon />
 *       <GameErrorBoundary.Title>Inventory Crashed</GameErrorBoundary.Title>
 *       <GameErrorBoundary.Actions>
 *         <GameErrorBoundary.RetryButton>Reload Inventory</GameErrorBoundary.RetryButton>
 *       </GameErrorBoundary.Actions>
 *     </GameErrorBoundary.Container>
 *   }
 * >
 *   <InventoryPanel />
 * </GameErrorBoundary>
 * ```
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
    const updater = (this as any).updater;
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
      const ringBuffer = LoggerManager.getInstance().ringBuffer;
      const logs = ringBuffer.exportAsText();
      const err = this.state.error;
      const gameError = err instanceof GameBaseError ? err : null;

      const diagnosticReport = [
        "=== VIBRANT CASTLE CRASH REPORT ===",
        `Timestamp: ${new Date().toISOString()}`,
        `Error: ${err?.name || "Error"}: ${err?.message || "Unknown"}`,
        gameError ? `Domain: ${gameError.domain}` : null,
        gameError ? `Code: ${gameError.code}` : null,
        gameError?.details ? `Details: ${JSON.stringify(gameError.details, null, 2)}` : null,
        gameError ? `Log Context: ${JSON.stringify(gameError.toLogContext(), null, 2)}` : null,
        `Stack: ${err?.stack || "No stack"}`,
        `Component Stack: ${this.state.componentStack || "No component stack"}`,
        "\n=== RECENT GAME LOGS ===",
        logs || "No logs in ring buffer",
      ]
        .filter(Boolean)
        .join("\n");

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

export * from "./error-boundary/index";
export default GameErrorBoundary;
