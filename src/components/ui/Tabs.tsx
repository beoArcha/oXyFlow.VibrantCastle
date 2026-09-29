import React from "react";
import { cn } from "@lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "shrink-0 flex flex-wrap items-center gap-1.5 p-1.5 bg-[#120502]/95 border border-amber-500/30 rounded-xl shadow-inner",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
              isActive
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60 border border-amber-400 font-black"
                : "bg-black/40 text-stone-300 hover:text-amber-200 hover:bg-[#240e06] border border-stone-800/80 hover:border-amber-700/50"
            )}
          >
            {tab.icon && (
              <span className={cn("flex items-center shrink-0", isActive ? "text-amber-200" : "text-amber-400/80")}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isActive ? "bg-black/40 text-amber-200" : "bg-stone-800 text-stone-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
