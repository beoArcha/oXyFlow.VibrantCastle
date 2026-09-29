import React from "react";
import { Copy, Check } from "lucide-react";
import { Button, ButtonProps } from "../Button";
import { useGameErrorContext } from "./GameErrorContext";

export interface GameErrorCopyButtonProps extends Partial<ButtonProps> {
  copiedLabel?: string;
  defaultLabel?: string;
}

/**
 * Action button that copies the diagnostic crash report and recent ring buffer logs to clipboard.
 */
export const GameErrorCopyButton = React.memo(
  React.forwardRef<HTMLButtonElement, GameErrorCopyButtonProps>(function GameErrorCopyButton(
    {
      copiedLabel = "Report Copied!",
      defaultLabel = "Copy Diagnostic Log",
      onClick,
      variant = "secondary",
      size = "md",
      ...props
    },
    ref
  ) {
    const context = useGameErrorContext();

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        await context.onCopyReport();
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        icon={context.isCopied ? <Check size={14} className="shrink-0 text-emerald-400" /> : <Copy size={14} className="shrink-0" />}
        onClick={handleClick}
        {...props}
      >
        {context.isCopied ? copiedLabel : defaultLabel}
      </Button>
    );
  })
);

GameErrorCopyButton.displayName = "GameErrorBoundary.CopyButton";
