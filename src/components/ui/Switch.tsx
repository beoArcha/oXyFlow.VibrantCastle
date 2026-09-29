import React from "react";
import { cn } from "@lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const trackSizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-8 h-4.5 p-0.5",
  md: "w-11 h-6 p-0.5",
  lg: "w-14 h-7.5 p-1",
};

const thumbSizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-5.5 h-5.5",
};

const thumbTranslateClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "translate-x-3.5",
  md: "translate-x-5",
  lg: "translate-x-6.5",
};

/**
 * Accessible toggle switch primitive conforming to WAI-ARIA switch pattern.
 * Supports smooth thumb translation, label/description layout, and sizes.
 */
export const Switch = React.memo(
  React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
    {
      checked,
      onCheckedChange,
      label,
      description,
      size = "md",
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    const switchElement = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
          trackSizeClasses[size],
          checked
            ? "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-400 shadow-md shadow-amber-950/60"
            : "bg-stone-900 border-stone-700 hover:border-stone-600",
          disabled && "opacity-50 cursor-not-allowed hover:border-stone-700",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
            thumbSizeClasses[size],
            checked ? cn(thumbTranslateClasses[size], "bg-amber-100") : "translate-x-0 bg-stone-300"
          )}
        />
      </button>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div className="flex items-start justify-between gap-3 text-left select-none">
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={id}
              onClick={id ? undefined : handleClick}
              className={cn(
                "text-xs font-semibold text-stone-200 cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span className={cn("text-[11px] text-stone-400 leading-tight", disabled && "opacity-50")}>
              {description}
            </span>
          )}
        </div>
        {switchElement}
      </div>
    );
  })
);

Switch.displayName = "Switch";

export default Switch;
