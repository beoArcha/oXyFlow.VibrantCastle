import React, { useContext } from "react";
import { GameErrorContextViolationError } from "@lib/errors";

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
    throw new GameErrorContextViolationError();
  }
  return context;
}
