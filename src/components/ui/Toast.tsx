import React, { useEffect } from "react";
import { cn } from "@lib/utils";
import { useToast, UseToastReturn } from "./hooks/useToast";

export type { UseToastReturn };
export { useToast };

export type ToastVariant = "info" | "success" | "warning" | "danger";
export type ToastPosition = "top" | "bottom" | "inline";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly message?: string | null;
  readonly variant?: ToastVariant;
  readonly position?: ToastPosition;
  readonly duration?: number;
  readonly onDismiss?: () => void;
  readonly icon?: React.ReactNode;
}

/**
 * Gothic theme toast notification primitive for alerts, feedback, and action confirmations.
 * Supports auto-dismiss timer and accessible WAI-ARIA status semantics.
 *
 * @example
 * ```tsx
 * <Toast message="Key successfully bound!" variant="info" onDismiss={handleDismiss} />
 * ```
 */
export const Toast = React.memo(
  React.forwardRef<HTMLDivElement, ToastProps>(function Toast(
    {
      message,
      children,
      variant = "info",
      position = "top",
      duration = 4000,
      onDismiss,
      icon,
      className,
      ...props
    },
    ref
  ) {
    useEffect(() => {
      const content = message ?? children;
      if (content && onDismiss && duration > 0) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [message, children, duration, onDismiss]);

    const content = message ?? children;
    if (!content) {
      return null;
    }

    const positionClasses: Record<ToastPosition, string> = {
      top: "fixed top-14 left-1/2 -translate-x-1/2 z-50",
      bottom: "fixed bottom-14 left-1/2 -translate-x-1/2 z-50",
      inline: "w-full",
    };

    const variantClasses: Record<ToastVariant, string> = {
      info: "bg-amber-600 text-white border-amber-400 shadow-amber-950/40",
      success: "bg-emerald-700 text-white border-emerald-500 shadow-emerald-950/40",
      warning: "bg-orange-600 text-white border-orange-400 shadow-orange-950/40",
      danger: "bg-red-700 text-white border-red-500 shadow-red-950/40",
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          positionClasses[position],
          "px-4 py-2 rounded-xl shadow-2xl text-xs font-bold border flex items-center justify-between gap-2 select-none animate-in fade-in duration-200",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{content}</span>
        </div>
      </div>
    );
  })
);

Toast.displayName = "Toast";

export default Toast;
