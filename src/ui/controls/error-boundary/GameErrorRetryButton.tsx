import React from "react";
import { RefreshCw } from "lucide-react";
import { Button, ButtonProps } from "../../primitives/Button";
import { useGameErrorContext } from "./GameErrorContext";

export interface GameErrorRetryButtonProps extends Partial<ButtonProps> {
  children?: React.ReactNode;
}

/**
 * Action button that resets the error boundary state and re-renders children.
 */
export const GameErrorRetryButton = React.memo(
  React.forwardRef<HTMLButtonElement, GameErrorRetryButtonProps>(function GameErrorRetryButton(
    { children = "Retry Interface", onClick, variant = "primary", size = "md", icon, ...props },
    ref
  ) {
    const context = useGameErrorContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        context.onRetry();
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        icon={icon ?? <RefreshCw size={14} className="shrink-0" />}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  })
);

GameErrorRetryButton.displayName = "GameErrorBoundary.RetryButton";
