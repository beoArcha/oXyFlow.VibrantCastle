import React from "react";
import { cn } from "@lib/utils";
import { Paragraph } from "../../typography";
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
      <Paragraph
        ref={ref}
        size="xs"
        className={cn("text-stone-400 max-w-md mx-auto", className)}
        {...props}
      >
        {content}
      </Paragraph>
    );
  })
);

GameErrorDescription.displayName = "GameErrorBoundary.Description";
