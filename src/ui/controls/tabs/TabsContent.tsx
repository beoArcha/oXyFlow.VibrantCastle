import React from "react";
import { cn } from "@lib/utils";
import { useTabsContext } from "./TabsContext";

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique value pairing this panel to its associated TabsTrigger */
  value: string;
  /** When true, preserves the DOM node with hidden attribute instead of unmounting */
  forceMount?: boolean;
}

/**
 * Tab panel content primitive adhering to WAI-ARIA tabpanel semantics.
 * Only displays its children when its value matches the currently active tab.
 */
export const TabsContent = React.memo(
  React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
    { value, forceMount = false, children, className, ...props },
    ref
  ) {
    const { activeValue } = useTabsContext("Content");
    const isActive = activeValue === value;

    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        hidden={!isActive}
        tabIndex={0}
        className={cn(
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500",
          !isActive && forceMount && "hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  })
);

TabsContent.displayName = "TabsContent";

export default TabsContent;
