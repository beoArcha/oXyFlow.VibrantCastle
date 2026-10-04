import React from "react";
import { cn } from "@lib/utils";
import { useGameErrorContext } from "./GameErrorContext";

export interface GameErrorDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

/**
 * Descriptive paragraph explaining the error state and data safety.
 */
export const GameErrorDescription = React.memo(
  React.forwardRef<HTMLParagraphElement, GameErrorDescriptionProps>(function GameErrorDescription(
    { children, className, ...props },
    ref
  ) {
    const context = useGameErrorContext();
    const content = children ?? context.fallbackMessage;

    return (
      <p
        ref={ref}
        className={cn("text-xs text-stone-400 max-w-md mx-auto leading-relaxed", className)}
        {...props}
      >
        {content}
      </p>
    );
  })
);

GameErrorDescription.displayName = "GameErrorBoundary.Description";
