import React from "react";
import { cn } from "../../lib/utils";

export type BarVariant = "health" | "mana" | "stamina" | "amber" | "purple";

export interface ProgressBarProps {
  value: number;
  max: number;
  variant?: BarVariant;
  label?: string;
  showValueText?: boolean;
  icon?: React.ReactNode;
  heightClass?: string;
  className?: string;
}

const variantGradients: Record<BarVariant, { bar: string; border: string; text: string }> = {
  health: {
    bar: "bg-gradient-to-r from-red-700 via-red-600 to-red-400",
    border: "border-red-900/70",
    text: "text-red-300",
  },
  mana: {
    bar: "bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-400",
    border: "border-cyan-900/70",
    text: "text-cyan-300",
  },
  stamina: {
    bar: "bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400",
    border: "border-amber-900/70",
    text: "text-amber-300",
  },
  amber: {
    bar: "bg-gradient-to-r from-amber-600 to-amber-400",
    border: "border-amber-900/60",
    text: "text-amber-200",
  },
  purple: {
    bar: "bg-gradient-to-r from-purple-700 to-purple-400",
    border: "border-purple-900/70",
    text: "text-purple-300",
  },
};

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  value,
  max,
  variant = "health",
  label,
  showValueText = true,
  icon,
  heightClass = "h-2",
  className,
}) => {
  const percentage = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const style = variantGradients[variant];

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {(label || showValueText) && (
        <div className="flex justify-between items-center text-[10px] font-semibold leading-tight">
          <span className={cn("flex items-center gap-1", style.text)}>
            {icon}
            {label}
          </span>
          {showValueText && (
            <span className="text-stone-300 font-mono tracking-tight">
              {Math.round(value)} / {Math.round(max)}
            </span>
          )}
        </div>
      )}

      {/* Track & Filled Bar */}
      <div
        className={cn(
          "w-full bg-[#140602] rounded-full overflow-hidden border p-[1px] shadow-inner relative",
          style.border,
          heightClass
        )}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-200 ease-out", style.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

export default ProgressBar;
