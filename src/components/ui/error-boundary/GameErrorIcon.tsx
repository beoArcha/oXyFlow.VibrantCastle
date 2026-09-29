import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@lib/utils";

export interface GameErrorIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

/**
 * Pulsing warning icon badge for the error screen.
 */
export const GameErrorIcon = React.memo(
  React.forwardRef<HTMLDivElement, GameErrorIconProps>(function GameErrorIcon(
    { icon, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "w-14 h-14 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 animate-pulse shrink-0",
          className
        )}
        {...props}
      >
        {icon ?? <AlertTriangle size={28} />}
      </div>
    );
  })
);

GameErrorIcon.displayName = "GameErrorBoundary.Icon";
