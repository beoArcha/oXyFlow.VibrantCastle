import React from "react";
import { cn } from "@lib/utils";

export interface SliderProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
  unit?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  icon,
  unit = "%",
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#fed7aa] font-medium flex items-center gap-1.5">
          {icon && <span className="text-[#d97706] shrink-0">{icon}</span>}
          {label}
        </span>
        <span className="font-bold text-[#fbbf24] font-mono">
          {value}{unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#140602] rounded-lg appearance-none cursor-pointer accent-[#f59e0b] border border-[#5c2d18]"
      />
    </div>
  );
};

export default Slider;
