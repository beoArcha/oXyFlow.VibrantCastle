import React from "react";
import { cn } from "@lib/utils";
import { useTabsContext } from "./TabsContext";

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unique tab identifier corresponding to associated TabsContent */
  value: string;
  /** Optional icon displayed to the left of the label */
  icon?: React.ReactNode;
  /** Optional badge text or counter value */
  badge?: string | number;
  /** Optional keyboard shortcut badge label e.g. "M", "Esc", "1" */
  keyLabel?: string;
}

/**
 * Interactive tab item primitive adhering to WAI-ARIA tab semantics.
 * Connects to parent TabsContext to report and reflect active selection state.
 */
export const TabsTrigger = React.memo(
  React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
    { value, icon, badge, keyLabel, children, className, disabled, onClick, ...props },
    ref
  ) {
    const { activeValue, setActiveValue } = useTabsContext("Trigger");
    const isActive = activeValue === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!disabled && !e.defaultPrevented) {
        setActiveValue(value);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`tab-${value}`}
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
          isActive
            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60 border border-amber-400 font-black"
            : "bg-black/40 text-stone-300 hover:text-amber-200 hover:bg-[#240e06] border border-stone-800/80 hover:border-amber-700/50",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              "flex items-center shrink-0",
              isActive ? "text-amber-200" : "text-amber-400/80"
            )}
          >
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {badge !== undefined && (
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              isActive ? "bg-black/40 text-amber-200" : "bg-stone-800 text-stone-400"
            )}
          >
            {badge}
          </span>
        )}
        {keyLabel && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ml-0.5",
              isActive ? "bg-black/30 text-amber-200" : "bg-stone-900 text-stone-400"
            )}
          >
            [{keyLabel}]
          </span>
        )}
      </button>
    );
  })
);

TabsTrigger.displayName = "TabsTrigger";

export default TabsTrigger;
