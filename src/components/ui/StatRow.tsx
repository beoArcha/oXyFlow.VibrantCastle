import React from "react";
import { cn } from "@lib/utils";

export type StatRowVariant = "red" | "cyan" | "amber" | "purple" | "default";

export interface StatRowProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly variant?: StatRowVariant;
}

const textStyles: Record<StatRowVariant, string> = {
  red: "text-red-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  purple: "text-purple-300",
  default: "text-stone-300",
};

/**
 * Metric label-value row primitive for character attributes and telemetry stats.
 * Supports forwardRef, semantic color variants, and standard HTMLDivElement attributes.
 */
export const StatRow = React.memo(
  React.forwardRef<HTMLDivElement, StatRowProps>(function StatRow(
    { label, value, icon, variant = "default", className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn("flex justify-between items-center text-xs", className)}
        {...props}
      >
        <span className={cn("flex items-center gap-1.5", textStyles[variant])}>
          {icon && <span className="flex items-center shrink-0">{icon}</span>}
          <span>{label}:</span>
        </span>
        <span className="font-mono font-bold text-stone-100">{value}</span>
      </div>
    );
  })
);

StatRow.displayName = "StatRow";

export default StatRow;
