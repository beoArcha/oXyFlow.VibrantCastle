import { createContext, useContext } from "react";
import { TabsContextViolationError } from "@lib/errors";

export type TabsOrientation = "horizontal" | "vertical";

export interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  orientation: TabsOrientation;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * Accesses active tab state and navigation orientation from parent Tabs root.
 *
 * @throws {TabsContextViolationError} if used outside a Tabs component hierarchy.
 */
export function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new TabsContextViolationError(componentName);
  }
  return context;
}
