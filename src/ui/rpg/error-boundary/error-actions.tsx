import React from "react";
import { cn } from "@lib/utils";

export interface GameErrorActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Footer action buttons bar for the error boundary screen.
 */
export const GameErrorActions = React.memo(
  React.forwardRef<HTMLDivElement, GameErrorActionsProps>(function GameErrorActions(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap items-center justify-center gap-3 pt-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  })
);

GameErrorActions.displayName = "GameErrorBoundary.Actions";
