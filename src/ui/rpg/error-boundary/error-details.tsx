import React from "react";
import { cn } from "@lib/utils";
import { GameBaseError } from "@lib/errors";
import { useGameErrorContext } from "./error-state";

export interface GameErrorDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: Error | null;
}

/**
 * Technical crash diagnostics display detailing error name, message, code, and metadata.
 */
export const GameErrorDetails = React.memo(
  React.forwardRef<HTMLDivElement, GameErrorDetailsProps>(function GameErrorDetails(
    { error: errorProp, className, ...props },
    ref
  ) {
    const context = useGameErrorContext();
    const effectiveError = errorProp ?? context.error;

    if (!effectiveError) {
      return null;
    }

    const gameError = effectiveError instanceof GameBaseError ? effectiveError : null;

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-2.5", className)} {...props}>
        {gameError && (
          <div className="flex flex-wrap items-center gap-2 justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-900/60 text-red-200 border border-red-700/50">
              {`[${gameError.domain}]`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-stone-900/80 text-amber-300 border border-amber-500/30">
              {gameError.code}
            </span>
          </div>
        )}

        <div className="w-full text-left p-3 rounded-xl bg-surface-darkest border border-red-950/80 text-[11px] font-mono text-red-200/90 overflow-x-auto max-h-36 custom-scrollbar flex flex-col gap-1.5">
          <div>
            <span className="font-bold text-red-400">{effectiveError.name}:</span>{" "}
            {effectiveError.message}
          </div>
          {gameError?.details && Object.keys(gameError.details).length > 0 && (
            <div className="text-[10px] text-stone-400 pt-1.5 border-t border-stone-800/80">
              <span className="text-stone-500 font-sans font-semibold">Details: </span>
              {JSON.stringify(gameError.details)}
            </div>
          )}
          {context.componentStack && (
            <div className="text-[10px] text-stone-500 pt-1.5 border-t border-stone-800/80 whitespace-pre font-mono">
              <span className="text-stone-600 font-sans font-semibold">Component Trace: </span>
              {context.componentStack}
            </div>
          )}
        </div>
      </div>
    );
  })
);

GameErrorDetails.displayName = "GameErrorBoundary.Details";
