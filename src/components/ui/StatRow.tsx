import React from "react";
import { cn } from "@lib/utils";

export interface StatRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "red" | "cyan" | "amber" | "purple" | "default";
  className?: string;
}

const textStyles: Record<"red" | "cyan" | "amber" | "purple" | "default", string> = {
  red: "text-red-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  purple: "text-purple-300",
  default: "text-stone-300",
};

export const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  icon,
  variant = "default",
  className,
}) => {
  return (
    <div className={cn("flex justify-between items-center text-xs", className)}>
      <span className={cn("flex items-center gap-1.5", textStyles[variant])}>
        {icon && <span className="flex items-center shrink-0">{icon}</span>}
        <span>{label}:</span>
      </span>
      <span className="font-mono font-bold text-stone-100">{value}</span>
    </div>
  );
};

export default StatRow;
