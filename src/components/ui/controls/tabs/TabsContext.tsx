import { createContext, useContext } from "react";

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
 * @throws {Error} if used outside a Tabs component hierarchy.
 */
export function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<Tabs.${componentName}> must be rendered within a <Tabs> container.`);
  }
  return context;
}
