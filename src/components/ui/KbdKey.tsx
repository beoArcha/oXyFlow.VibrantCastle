import React from "react";
import { cn } from "@lib/utils";

export interface KbdKeyProps {
  children: React.ReactNode;
  variant?: "amber" | "purple" | "cyan" | "stone";
  className?: string;
}

const keyStyles = {
  amber: "bg-amber-950/80 text-amber-200 border-amber-600/70 shadow-amber-950/50",
  purple: "bg-purple-950/80 text-purple-200 border-purple-600/70 shadow-purple-950/50",
  cyan: "bg-cyan-950/80 text-cyan-200 border-cyan-600/70 shadow-cyan-950/50",
  stone: "bg-[#1c0c07] text-[#fed7aa] border-[#5c2d18] shadow-stone-950/50",
};

export const KbdKey: React.FC<KbdKeyProps> = React.memo(({
  children,
  variant = "stone",
  className,
}) => {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold border shadow-sm select-none",
        keyStyles[variant],
        className
      )}
    >
      {children}
    </kbd>
  );
});

export default KbdKey;
