import React from "react";
import { Button, ButtonProps } from "../../primitives/Button";
import { useGameErrorContext } from "./GameErrorContext";

export interface GameErrorReloadButtonProps extends Partial<ButtonProps> {
  children?: React.ReactNode;
}

/**
 * Action button that reloads the browser window.
 */
export const GameErrorReloadButton = React.memo(
  React.forwardRef<HTMLButtonElement, GameErrorReloadButtonProps>(function GameErrorReloadButton(
    { children = "Reload Game", onClick, variant = "ghost", size = "sm", className, ...props },
    ref
  ) {
    const context = useGameErrorContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        context.onReload();
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className ?? "text-stone-400 hover:text-stone-200"}
        {...props}
      >
        {children}
      </Button>
    );
  })
);

GameErrorReloadButton.displayName = "GameErrorBoundary.ReloadButton";
