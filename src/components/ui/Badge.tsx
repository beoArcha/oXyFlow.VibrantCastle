import React from "react";
import { cn } from "@lib/utils";

export type BadgeVariant = "amber" | "red" | "cyan" | "purple" | "green" | "stone";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly icon?: React.ReactNode;
}

const badgeStyles: Record<BadgeVariant, string> = {
  amber: "bg-amber-950/80 text-amber-300 border-amber-600/50",
  red: "bg-red-950/80 text-red-300 border-red-700/50",
  cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-700/50",
  purple: "bg-purple-950/80 text-purple-300 border-purple-700/50",
  green: "bg-green-950/80 text-green-300 border-green-700/50",
  stone: "bg-stone-900/90 text-stone-300 border-stone-700",
};

/**
 * Visual status tag and badge primitive.
 * Supports forwardRef, semantic color variants, and optional icon slots.
 */
export const Badge = React.memo(
  React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { children, variant = "amber", icon, className, ...props },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold border whitespace-nowrap select-none",
          badgeStyles[variant],
          className
        )}
        {...props}
      >
        {icon && <span className="flex items-center shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  })
);

Badge.displayName = "Badge";

export default Badge;
