import React from "react";
import { cn } from "@lib/utils";

export interface KeyedTabItem<T = string> {
  id: T;
  label: React.ReactNode;
  keyLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface KeyedTabsProps<T = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: KeyedTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  trailingAction?: React.ReactNode;
  className?: string;
}

/**
 * Generic navigation tab strip supporting keyboard shortcut badges and optional trailing actions.
 * Provides accessible tab semantics (role="tablist", role="tab", aria-selected) with gothic styling.
 */
export const KeyedTabs = React.memo(
  React.forwardRef(function KeyedTabs<T = string>(
    {
      items,
      activeId,
      onChange,
      trailingAction,
      className,
      ...props
    }: KeyedTabsProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          "shrink-0 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#120502]/95 border border-amber-500/35 rounded-xl text-xs font-semibold select-none shadow-md",
          className
        )}
        {...props}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={String(item.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    onChange(item.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  item.disabled
                    ? "opacity-40 cursor-not-allowed bg-black/40 text-stone-500 border border-stone-900"
                    : "cursor-pointer",
                  isActive && !item.disabled
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-md shadow-amber-950/60"
                    : !item.disabled &&
                        "bg-black/50 hover:bg-amber-950/50 text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-600/60"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.keyLabel && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none",
                      isActive
                        ? "bg-black/30 text-amber-200"
                        : "bg-stone-900 text-stone-400"
                    )}
                  >
                    [{item.keyLabel}]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {trailingAction && <div className="ml-auto flex items-center">{trailingAction}</div>}
      </div>
    );
  })
) as <T = string>(
  props: KeyedTabsProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

(KeyedTabs as React.FC).displayName = "KeyedTabs";

export default KeyedTabs;
