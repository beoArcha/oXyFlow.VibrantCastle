import React from "react";
import { cn } from "@lib/utils";

export interface GameErrorContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Outer visual wrapper for the gothic error boundary fallback display.
 */
export const GameErrorContainer = React.memo(
  React.forwardRef<HTMLDivElement, GameErrorContainerProps>(function GameErrorContainer(
    { children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          "w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-[#0c0302] text-stone-200",
          className
        )}
        {...props}
      >
        <div className="max-w-xl w-full p-6 rounded-2xl bg-[#170603] border-2 border-red-900/60 shadow-2xl shadow-red-950/40 flex flex-col gap-4 text-center items-center font-sans">
          {children}
        </div>
      </div>
    );
  })
);

GameErrorContainer.displayName = "GameErrorBoundary.Container";
