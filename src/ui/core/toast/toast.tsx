import React, { useEffect } from "react";
import { cn } from "@lib/utils";
import { toastVariants, type ToastVariantProps } from "./toast-variants";

export type ToastVariant = NonNullable<ToastVariantProps["variant"]>;
export type ToastPosition = NonNullable<ToastVariantProps["position"]>;

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ToastVariantProps {
  readonly message?: string | null;
  readonly duration?: number;
  readonly onDismiss?: () => void;
  readonly icon?: React.ReactNode;
}

/**
 * Gothic theme toast notification primitive for alerts, feedback, and action confirmations.
 * Supports auto-dismiss timer and accessible WAI-ARIA status semantics.
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

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(toastVariants({ variant, position }), className)}
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
