import React from "react";
import { Info, AlertTriangle, AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@lib/utils";
import { IconButton } from "./IconButton";

export type AlertVariant = "info" | "warning" | "danger" | "success";

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
}

const variantStyles: Record<AlertVariant, { container: string; title: string; defaultIcon: React.ReactNode }> = {
  info: {
    container: "bg-cyan-950/40 border-cyan-700/60 text-cyan-200",
    title: "text-cyan-300 font-bold",
    defaultIcon: <Info size={15} className="text-cyan-400 shrink-0" />,
  },
  warning: {
    container: "bg-amber-950/40 border-amber-600/50 text-amber-200",
    title: "text-amber-300 font-bold",
    defaultIcon: <AlertTriangle size={15} className="text-amber-400 shrink-0" />,
  },
  danger: {
    container: "bg-rose-950/50 border-rose-600/70 text-rose-200",
    title: "text-rose-300 font-bold",
    defaultIcon: <AlertCircle size={15} className="text-rose-400 shrink-0" />,
  },
  success: {
    container: "bg-emerald-950/40 border-emerald-600/60 text-emerald-200",
    title: "text-emerald-300 font-bold",
    defaultIcon: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  },
};

/**
 * Gothic Castle contextual feedback callout banner for notifications, warnings, and errors.
 */
export const Alert = React.memo(
  React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    {
      variant = "info",
      title,
      icon,
      onClose,
      closeAriaLabel = "Dismiss alert",
      children,
      className,
      ...props
    },
    ref
  ) {
    const config = variantStyles[variant];
    const effectiveIcon = icon !== undefined ? icon : config.defaultIcon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed transition-all",
          config.container,
          className
        )}
        {...props}
      >
        {effectiveIcon && <div className="mt-0.5 shrink-0">{effectiveIcon}</div>}

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {title && <div className={config.title}>{title}</div>}
          {children && <div className="text-[11px] opacity-90">{children}</div>}
        </div>

        {onClose && (
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={closeAriaLabel}
            onClick={onClose}
            className="text-current opacity-70 hover:opacity-100 -mr-1 -mt-1 shrink-0"
          >
            <X size={13} />
          </IconButton>
        )}
      </div>
    );
  })
);

Alert.displayName = "Alert";

export default Alert;
