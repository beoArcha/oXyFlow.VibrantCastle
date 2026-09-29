import React from "react";
import { cn } from "@lib/utils";

export type KbdKeyVariant = "amber" | "purple" | "cyan" | "stone";

export interface KbdKeyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: KbdKeyVariant;
}

const keyStyles: Record<KbdKeyVariant, string> = {
  amber: "bg-amber-950/80 text-amber-200 border-amber-600/70 shadow-amber-950/50",
  purple: "bg-purple-950/80 text-purple-200 border-purple-600/70 shadow-purple-950/50",
  cyan: "bg-cyan-950/80 text-cyan-200 border-cyan-600/70 shadow-cyan-950/50",
  stone: "bg-[#1c0c07] text-[#fed7aa] border-[#5c2d18] shadow-stone-950/50",
};

/**
 * Keyboard shortcut key badge primitive (<kbd>).
 * Supports forwardRef, semantic color variants, and standard HTML attributes.
 */
export const KbdKey = React.memo(
  React.forwardRef<HTMLElement, KbdKeyProps>(function KbdKey(
    { children, variant = "stone", className, ...props },
    ref
  ) {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold border shadow-sm select-none",
          keyStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  })
);

KbdKey.displayName = "KbdKey";

export default KbdKey;
