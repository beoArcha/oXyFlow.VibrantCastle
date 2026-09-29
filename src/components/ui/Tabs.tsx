import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@lib/utils";
import {
  TabsContext,
  TabsContextValue,
  TabsOrientation,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs/index";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled active tab value */
  value?: string;
  /** Uncontrolled default active tab value */
  defaultValue?: string;
  /** Callback fired when active tab changes */
  onValueChange?: (value: string) => void;
  /** Tab orientation (default: "horizontal") */
  orientation?: TabsOrientation;
  /** Legacy array of tab items for 100% backward compatibility */
  items?: TabItem[];
  /** Legacy active tab ID for 100% backward compatibility */
  activeId?: string;
  /** Legacy change callback for 100% backward compatibility */
  onChange?: (id: string) => void;
}

/**
 * Gothic Tabs composite component orchestrating active tab selection,
 * roving keyboard navigation, and tabpanel visibility.
 *
 * Supports both modern Compound Component composition (<Tabs.List>, <Tabs.Trigger>, <Tabs.Content>)
 * and backward-compatible legacy array mode (items={...}).
 */
const TabsRoot = React.memo(
  React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
    {
      value: controlledValue,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      items,
      activeId,
      onChange,
      children,
      className,
      ...props
    },
    ref
  ) {
    // Legacy Array Mode: compose TabsList and TabsTrigger primitives without code duplication
    if (items && items.length > 0) {
      const currentActive = activeId ?? items[0]?.id;
      const legacyContextValue: TabsContextValue = {
        activeValue: currentActive,
        setActiveValue: (newVal: string) => onChange?.(newVal),
        orientation,
      };

      return (
        <TabsContext.Provider value={legacyContextValue}>
          <TabsList ref={ref} className={className} {...props}>
            {items.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                icon={tab.icon}
                badge={tab.badge}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </TabsContext.Provider>
      );
    }

    // Compound Component Mode: manage controlled/uncontrolled state via TabsContext
    const [internalValue, setInternalValue] = useState<string>(defaultValue ?? "");
    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? controlledValue : internalValue;

    const setActiveValue = useCallback(
      (newVal: string) => {
        if (!isControlled) {
          setInternalValue(newVal);
        }
        onValueChange?.(newVal);
      },
      [isControlled, onValueChange]
    );

    const contextValue = useMemo<TabsContextValue>(
      () => ({
        activeValue,
        setActiveValue,
        orientation,
      }),
      [activeValue, setActiveValue, orientation]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  })
);

TabsRoot.displayName = "Tabs";

export interface TabsComponent
  extends React.MemoExoticComponent<
    React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>
  > {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
}

export const Tabs = TabsRoot as unknown as TabsComponent;
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export * from "./tabs/index";
export default Tabs;
