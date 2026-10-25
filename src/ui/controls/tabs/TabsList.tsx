import React from "react";
import { cn } from "@lib/utils";
import { useTabsContext } from "./TabsContext";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  /** Optional trailing action slot aligned to the right (e.g. close/resume button) */
  trailingAction?: React.ReactNode;
}

/**
 * Tab list container managing WAI-ARIA tablist semantics and roving keyboard navigation
 * (ArrowLeft/ArrowRight, ArrowUp/ArrowDown, Home, End).
 */
export const TabsList = React.memo(
  React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
    { className, children, onKeyDown, trailingAction, ...props },
    ref
  ) {
    const { orientation } = useTabsContext("List");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      const container = e.currentTarget;
      const tabTriggers = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      if (tabTriggers.length === 0) return;

      const focusedIndex = tabTriggers.findIndex(
        (tab) => tab === document.activeElement || tab.contains(document.activeElement)
      );
      const selectedIndex = tabTriggers.findIndex(
        (tab) => tab.getAttribute("aria-selected") === "true"
      );
      const currentIndex =
        focusedIndex !== -1 ? focusedIndex : selectedIndex !== -1 ? selectedIndex : 0;

      let nextIndex = currentIndex;
      const isHorizontal = orientation === "horizontal";

      if ((isHorizontal && e.key === "ArrowRight") || (!isHorizontal && e.key === "ArrowDown")) {
        nextIndex = (currentIndex + 1) % tabTriggers.length;
        e.preventDefault();
      } else if (
        (isHorizontal && e.key === "ArrowLeft") ||
        (!isHorizontal && e.key === "ArrowUp")
      ) {
        nextIndex = (currentIndex - 1 + tabTriggers.length) % tabTriggers.length;
        e.preventDefault();
      } else if (e.key === "Home") {
        nextIndex = 0;
        e.preventDefault();
      } else if (e.key === "End") {
        nextIndex = tabTriggers.length - 1;
        e.preventDefault();
      }

      if (nextIndex !== currentIndex) {
        tabTriggers[nextIndex].focus();
        tabTriggers[nextIndex].click();
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn(
          "shrink-0 flex items-center justify-between gap-1.5 p-1.5 bg-surface-darkest/95 border border-primary-500/30 rounded-xl shadow-inner",
          orientation === "horizontal" ? "flex-wrap" : "flex-col items-stretch",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex items-center gap-1.5",
            orientation === "horizontal" ? "flex-wrap" : "flex-col items-stretch"
          )}
        >
          {children}
        </div>
        {trailingAction && <div className="ml-auto flex items-center">{trailingAction}</div>}
      </div>
    );
  })
);

TabsList.displayName = "TabsList";

export default TabsList;
