import React from "react";
import { cn } from "@lib/utils";

export type ProgressBarVariant =
  | "danger"
  | "info"
  | "warning"
  | "amber"
  | "purple"
  // Backward-compatible aliases
  | "health"
  | "mana"
  | "stamina";

export type BarVariant = ProgressBarVariant;
export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current progress value */
  value: number;
  /** Maximum progress value (must be > 0) */
  max: number;
  /** Color theme variant */
  variant?: ProgressBarVariant;
  /** Size preset controlling bar height */
  size?: ProgressBarSize;
  /** Optional label displayed above the progress bar */
  label?: string;
  /** Whether to show numeric value/max text (default: true) */
  showValueText?: boolean;
  /** Optional icon displayed alongside label */
  icon?: React.ReactNode;
  /** Custom height class override (e.g. "h-1.5") for backward compatibility */
  heightClass?: string;
  /** Enables animated shimmer effect across the bar */
  animated?: boolean;
  /** Custom bar gradient/color class override */
  barClassName?: string;
  /** Custom accessible value text for screen readers */
  ariaValueText?: string;
}

const dangerGradient = {
  bar: "bg-gradient-to-r from-red-700 via-red-600 to-red-400",
  border: "border-red-900/70",
  text: "text-red-300",
  glow: "shadow-red-950/40",
};

const infoGradient = {
  bar: "bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-400",
  border: "border-cyan-900/70",
  text: "text-cyan-300",
  glow: "shadow-cyan-950/40",
};

const warningGradient = {
  bar: "bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400",
  border: "border-amber-900/70",
  text: "text-amber-300",
  glow: "shadow-amber-950/40",
};

const amberGradient = {
  bar: "bg-gradient-to-r from-amber-600 to-amber-400",
  border: "border-amber-900/60",
  text: "text-amber-200",
  glow: "shadow-amber-950/40",
};

const purpleGradient = {
  bar: "bg-gradient-to-r from-purple-700 to-purple-400",
  border: "border-purple-900/70",
  text: "text-purple-300",
  glow: "shadow-purple-950/40",
};

const variantGradients: Record<ProgressBarVariant, { bar: string; border: string; text: string; glow: string }> = {
  danger: dangerGradient,
  info: infoGradient,
  warning: warningGradient,
  amber: amberGradient,
  purple: purpleGradient,
  // Backward-compatible aliases
  health: dangerGradient,
  mana: infoGradient,
  stamina: warningGradient,
};

const sizeHeightStyles: Record<ProgressBarSize, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

/**
 * Gothic resource bar primitive (Health, Mana, Stamina, Experience).
 * Guarantees mathematical clamping [0, 100%], full WAI-ARIA progressbar semantics,
 * and high-frequency render memoization.
 */
export const ProgressBar = React.memo(
  React.forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
    {
      value,
      max,
      variant = "danger",
      size = "md",
      label,
      showValueText = true,
      icon,
      heightClass,
      animated = false,
      barClassName,
      ariaValueText,
      className,
      ...props
    },
    ref
  ) {
    const safeMax = typeof max === "number" && !Number.isNaN(max) && max > 0 ? max : 1;
    const safeValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    const percentage = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));

    const style = variantGradients[variant];
    const effectiveHeightClass = heightClass || sizeHeightStyles[size];
    const formattedValue = Math.round(safeValue);
    const formattedMax = Math.round(safeMax);

    return (
      <div ref={ref} className={cn("flex flex-col gap-1 w-full", className)} {...props}>
        {(label || showValueText) && (
          <div className="flex justify-between items-center text-[10px] font-semibold leading-tight select-none">
            <span className={cn("flex items-center gap-1", style.text)}>
              {icon}
              {label}
            </span>
            {showValueText && (
              <span className="text-stone-300 font-mono tracking-tight">
                {formattedValue} / {formattedMax}
              </span>
            )}
          </div>
        )}

        {/* Track & Filled Bar */}
        <div
          className={cn(
            "w-full bg-[#140602] rounded-full overflow-hidden border p-[1px] shadow-inner relative",
            style.border,
            style.glow,
            effectiveHeightClass
          )}
          role="progressbar"
          aria-valuenow={formattedValue}
          aria-valuemin={0}
          aria-valuemax={formattedMax}
          aria-valuetext={ariaValueText ?? `${formattedValue} / ${formattedMax}`}
          aria-label={label}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden",
              barClassName || style.bar
            )}
            style={{ width: `${percentage}%` }}
          >
            {animated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[pulse_2s_infinite]" />
            )}
          </div>
        </div>
      </div>
    );
  })
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
