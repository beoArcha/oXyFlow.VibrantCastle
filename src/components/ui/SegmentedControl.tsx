import React from "react";
import { cn } from "@lib/utils";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  gridCols?: 2 | 3 | 4;
  className?: string;
  disabled?: boolean;
}

const gridColClasses: Record<2 | 3 | 4, string> = {
  2: "grid grid-cols-2 gap-1",
  3: "grid grid-cols-3 gap-1",
  4: "grid grid-cols-2 sm:grid-cols-4 gap-1",
};

/**
 * SegmentedControl
 *
 * Accessible pill switch for mutually exclusive options.
 * Conforms to gothic castle theme with warm amber highlights and active states.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = "sm",
  fullWidth = false,
  gridCols,
  className,
  disabled = false,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div
      role="radiogroup"
      className={cn(
        gridCols
          ? cn("bg-black/60 p-1 rounded-xl border border-stone-800 select-none", gridColClasses[gridCols])
          : "inline-flex items-center bg-black/60 p-0.5 rounded-lg border border-stone-800 select-none",
        fullWidth && "w-full",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const isDisabled = disabled || opt.disabled;

        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            title={opt.title}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={cn(
              "flex items-center justify-center gap-1 font-bold transition-all rounded cursor-pointer",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
              fullWidth && "flex-1",
              isSelected
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-500/50 shadow-sm shadow-amber-950/40"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border border-transparent",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
