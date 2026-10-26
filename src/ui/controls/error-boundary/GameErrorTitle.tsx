import React from "react";
import { cn } from "@lib/utils";
import { Heading } from "../../typography";
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
      <Heading
        ref={ref}
        level={2}
        variant="danger"
        size="xl"
        className={cn(
          "uppercase tracking-wide",
          className
        )}
        {...props}
      >
        {content}
      </Heading>
    );
  })
);

GameErrorTitle.displayName = "GameErrorBoundary.Title";
