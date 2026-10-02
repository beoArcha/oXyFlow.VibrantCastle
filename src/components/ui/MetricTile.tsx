import React from "react";
import { cn } from "@lib/utils";

export type MetricTileVariant =
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "purple"
  | "blue"
  | "stone";

export interface MetricTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric descriptive title or label */
  label: React.ReactNode;
  /** Primary metric value (number, text, or badge) */
  value: React.ReactNode;
  /** Leading icon for the metric */
  icon?: React.ReactNode;
  /** Optional secondary unit or target subtext (e.g. "ms", "/ 60") */
  subtext?: React.ReactNode;
  /** Semantic color theme variant */
  variant?: MetricTileVariant;
  /** Compact padding and font size for dense dashboard layouts */
  compact?: boolean;
}

const variantStyles: Record<
  MetricTileVariant,
  { icon: string; value: string; borderHover?: string }
> = {
  emerald: {
    icon: "text-emerald-400",
    value: "text-emerald-300",
    borderHover: "hover:border-emerald-800/60",
  },
  amber: {
    icon: "text-amber-400",
    value: "text-amber-300",
    borderHover: "hover:border-amber-800/60",
  },
  rose: {
    icon: "text-rose-400",
    value: "text-rose-300",
    borderHover: "hover:border-rose-800/60",
  },
  cyan: {
    icon: "text-cyan-400",
    value: "text-cyan-300",
    borderHover: "hover:border-cyan-800/60",
  },
  purple: {
    icon: "text-purple-400",
    value: "text-purple-300",
    borderHover: "hover:border-purple-800/60",
  },
  blue: {
    icon: "text-blue-400",
    value: "text-blue-300",
    borderHover: "hover:border-blue-800/60",
  },
  stone: {
    icon: "text-stone-400",
    value: "text-stone-300",
    borderHover: "hover:border-stone-700",
  },
};

/**
 * Telemetry indicator tile displaying an icon, label, primary value, and optional unit.
 */
export const MetricTile = React.memo(
  React.forwardRef<HTMLDivElement, MetricTileProps>(function MetricTile(
    {
      label,
      value,
      icon,
      subtext,
      variant = "stone",
      compact = false,
      className,
      ...props
    },
    ref
  ) {
    const style = variantStyles[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col bg-[#140602] rounded-xl border border-stone-800 transition-colors",
          style.borderHover,
          compact ? "p-2 gap-0.5" : "p-2.5 gap-1",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold select-none">
          {icon && <span className={cn("flex items-center shrink-0", style.icon)}>{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-baseline mt-0.5">
          <span
            className={cn(
              "font-bold font-mono tracking-tight",
              compact ? "text-sm" : "text-base",
              style.value
            )}
          >
            {value}
          </span>
          {subtext && (
            <span className="text-xs text-stone-500 font-normal ml-1 select-none">
              {subtext}
            </span>
          )}
        </div>
      </div>
    );
  })
);

MetricTile.displayName = "MetricTile";

export default MetricTile;
