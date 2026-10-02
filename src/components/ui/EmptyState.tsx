import React from "react";
import { cn } from "@lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

/**
 * Standard Gothic Castle empty state placeholder for lists, tables, and views with no data.
 */
export const EmptyState = React.memo(
  React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
    { icon, title, description, action, compact = false, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center select-none rounded-xl border border-stone-800/60 bg-black/40",
          compact ? "p-4 gap-1.5" : "p-8 gap-3",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="flex items-center justify-center text-stone-500 mb-1">
            {icon}
          </div>
        )}

        <div className="flex flex-col gap-1 max-w-sm">
          <h4
            className={cn(
              "font-bold text-stone-300",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {title}
          </h4>

          {description && (
            <p
              className={cn(
                "text-stone-500 leading-relaxed",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  })
);

EmptyState.displayName = "EmptyState";

export default EmptyState;
