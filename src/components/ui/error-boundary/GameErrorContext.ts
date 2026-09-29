import React, { useContext } from "react";

export interface GameErrorContextValue {
  error: Error | null;
  componentStack: string | null;
  isCopied: boolean;
  fallbackTitle: string;
  fallbackMessage: string;
  onRetry: () => void;
  onReload: () => void;
  onCopyReport: () => Promise<void>;
}

export const GameErrorContext = React.createContext<GameErrorContextValue | null>(null);

export function useGameErrorContext(): GameErrorContextValue {
  const context = useContext(GameErrorContext);
  if (!context) {
    throw new Error(
      "GameErrorBoundary compound subcomponents must be rendered within a GameErrorBoundary error state."
    );
  }
  return context;
}
