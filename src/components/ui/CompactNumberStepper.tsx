import React, { useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@lib/utils";

export interface CompactNumberStepperProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Compact Gothic number input with decrement/increment controls, keyboard navigation, and boundary clamping.
 */
export const CompactNumberStepper: React.FC<CompactNumberStepperProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  className = "",
  containerClassName = "",
}) => {
  const clamp = useCallback(
    (val: number) => {
      let clamped = val;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max]
  );

  const handleDecrement = () => {
    if (disabled) return;
    onChange(clamp(value - step));
  };

  const handleIncrement = () => {
    if (disabled) return;
    onChange(clamp(value + step));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min !== undefined ? min : 0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const isMinReached = min !== undefined && value <= min;
  const isMaxReached = max !== undefined && value >= max;

  return (
    <div className={cn("flex flex-col gap-0.5 select-none", containerClassName)}>
      {label && (
        <span className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase truncate">
          {label}
        </span>
      )}
      <div
        className={cn(
          "flex items-center h-7 rounded-lg bg-black/60 border border-stone-800 focus-within:border-amber-500/80 transition-all overflow-hidden shadow-inner",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={handleDecrement}
          disabled={disabled || isMinReached}
          className="flex items-center justify-center w-6 h-full text-stone-400 hover:text-amber-200 hover:bg-stone-800/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition-colors cursor-pointer"
        >
          <Minus size={11} />
        </button>

        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          className="flex-1 w-full min-w-0 bg-transparent text-center font-mono text-xs text-amber-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {unit && (
          <span className="text-[9px] font-mono text-stone-500 pr-1 select-none pointer-events-none">
            {unit}
          </span>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={handleIncrement}
          disabled={disabled || isMaxReached}
          className="flex items-center justify-center w-6 h-full text-stone-400 hover:text-amber-200 hover:bg-stone-800/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition-colors cursor-pointer"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
};

export default CompactNumberStepper;
