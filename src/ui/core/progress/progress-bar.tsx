import React from "react";
import { cn } from "@lib/utils";
import {
  progressTrackVariants,
  progressBarVariants,
  progressLabelVariants,
  type ProgressBarVariant,
  type ProgressBarSize,
} from "./progress-variants";

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

    const formattedValue = Math.round(safeValue);
    const formattedMax = Math.round(safeMax);

    return (
      <div
        ref={ref}
        data-slot="progress-bar"
        className={cn("flex flex-col gap-1 w-full", className)}
        {...props}
      >
        {(label || showValueText) && (
          <div className="flex justify-between items-center text-[10px] font-semibold leading-tight select-none">
            <span className={progressLabelVariants({ variant })}>
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
          data-slot="progress-track"
          className={cn(
            progressTrackVariants({ variant, size }),
            heightClass
          )}
          role="progressbar"
          aria-valuenow={formattedValue}
          aria-valuemin={0}
          aria-valuemax={formattedMax}
          aria-valuetext={ariaValueText ?? `${formattedValue} / ${formattedMax}`}
          aria-label={label}
        >
          <div
            data-slot="progress-fill"
            className={cn(
              progressBarVariants({ variant }),
              barClassName
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
