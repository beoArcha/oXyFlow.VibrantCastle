import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@lib/utils";

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** If true, the loading indicator is displayed. Defaults to true. */
  readonly isLoading?: boolean;
  /** Backward-compatible alias for isLoading */
  readonly loading?: boolean;
  /** Optional loading message or status label */
  readonly message?: React.ReactNode;
  /** Size of the spinner */
  readonly size?: "sm" | "md" | "lg";
  /** Visual presentation mode */
  readonly variant?: "overlay" | "inline" | "fullscreen";
}

const spinnerSizes = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

/**
 * Standard Gothic Castle loading indicator and backdrop overlay primitive.
 * Can be used as a standalone overlay, an inline spinner, or as a container wrapping children.
 */
export const LoadingOverlay = React.memo(
  React.forwardRef<HTMLDivElement, LoadingOverlayProps>(function LoadingOverlay(
    {
      isLoading,
      loading,
      message,
      size = "md",
      variant = "overlay",
      children,
      className,
      ...props
    },
    ref
  ) {
    const active = isLoading ?? loading ?? true;

    // When wrapping children and not active, render children directly without overlay wrapper
    if (!active && children) {
      return <>{children}</>;
    }

    if (!active && !children) {
      return null;
    }

    const spinnerNode = (
      <div className="flex flex-col items-center justify-center gap-2.5 text-center p-4">
        <Loader2
          className={cn(
            "animate-spin text-amber-primary drop-shadow-sm",
            spinnerSizes[size]
          )}
          aria-hidden="true"
        />
        {message && (
          <span className="text-xs font-mono font-medium text-amber-200/90 tracking-wide select-none">
            {message}
          </span>
        )}
      </div>
    );

    // If wrapping children, render children inside relative container with absolute overlay
    if (children) {
      return (
        <div ref={ref} className={cn("relative w-full h-full", className)} {...props}>
          {children}
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center z-50 rounded-[inherit]"
          >
            {spinnerNode}
          </div>
        </div>
      );
    }

    // Standalone presentation
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center justify-center select-none",
          variant === "fullscreen" && "fixed inset-0 bg-stone-950/85 backdrop-blur-sm z-50",
          variant === "overlay" && "absolute inset-0 bg-stone-950/75 backdrop-blur-xs z-30",
          variant === "inline" && "p-2",
          className
        )}
        {...props}
      >
        {spinnerNode}
      </div>
    );
  })
);

LoadingOverlay.displayName = "LoadingOverlay";

/**
 * Convenient semantic alias for LoadingOverlay with declarative boolean naming.
 */
export const IsLoading = LoadingOverlay;

export default LoadingOverlay;
