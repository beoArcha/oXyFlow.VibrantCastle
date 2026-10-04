import React from "react";
import { cn } from "@lib/utils";
import { useGameErrorContext } from "./GameErrorContext";

export interface GameErrorTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

/**
 * Heading title displaying the error boundary crash title.
 */
export const GameErrorTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, GameErrorTitleProps>(function GameErrorTitle(
    { children, className, ...props },
    ref
  ) {
    const context = useGameErrorContext();
    const content = children ?? context.fallbackTitle;

    return (
      <h2
        ref={ref}
        className={cn(
          "text-xl font-black text-red-300 tracking-wide uppercase font-serif",
          className
        )}
        {...props}
      >
        {content}
      </h2>
    );
  })
);

GameErrorTitle.displayName = "GameErrorBoundary.Title";
