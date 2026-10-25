import React, { useState, useCallback, useMemo } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@lib/utils";
import {
  TabsContext,
  type TabsContextValue,
  type TabsOrientation,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../controls/tabs/index";

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  keyLabel?: string;
  disabled?: boolean;
}

export type KeyedTabItem<T extends string = string> = TabItem<T>;

export interface TabsProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  orientation?: TabsOrientation;
  items?: TabItem<T>[];
  activeId?: T;
  onChange?: (id: T) => void;
  trailingAction?: React.ReactNode;
}

export type KeyedTabsProps<T extends string = string> = TabsProps<T>;

/**
 * Gothic Tabs composite component orchestrating active tab selection,
 * roving keyboard navigation, and tabpanel visibility.
 *
 * Supports both modern Compound Component composition (<Tabs.List>, <Tabs.Trigger>, <Tabs.Content>)
 * and backward-compatible legacy array mode (items={...}).
 */
const TabsRoot = React.memo(
  React.forwardRef(function Tabs<T extends string = string>(
    {
      value: controlledValue,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      items,
      activeId,
      onChange,
      trailingAction,
      children,
      className,
      ...props
    }: TabsProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) {
    if (items && items.length > 0) {
      const currentActive = String(activeId ?? controlledValue ?? items[0]?.id);
      const legacyContextValue: TabsContextValue = {
        activeValue: currentActive,
        setActiveValue: (newVal: string) => {
          onChange?.(newVal as T);
          onValueChange?.(newVal as T);
        },
        orientation,
      };

      return (
        <TabsContext.Provider value={legacyContextValue}>
          <TabsList ref={ref} trailingAction={trailingAction} className={className} {...props}>
            {items.map((tab) => (
              <TabsTrigger
                key={String(tab.id)}
                value={String(tab.id)}
                icon={tab.icon}
                badge={tab.badge}
                keyLabel={tab.keyLabel}
                disabled={tab.disabled}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </TabsContext.Provider>
      );
    }

    const [internalValue, setInternalValue] = useState<string>(defaultValue ?? "");
    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? controlledValue : internalValue;

    const setActiveValue = useCallback(
      (newVal: string) => {
        if (!isControlled) {
          setInternalValue(newVal);
        }
        onValueChange?.(newVal as T);
      },
      [isControlled, onValueChange]
    );

    const contextValue = useMemo<TabsContextValue>(
      () => ({
        activeValue: String(activeValue),
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

export interface TabsComponent {
  <T extends string = string>(
    props: TabsProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
  ): React.ReactElement | null;
  displayName?: string;
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
  BaseRoot: typeof BaseTabs.Root;
  BaseList: typeof BaseTabs.List;
  BaseTab: typeof BaseTabs.Tab;
  BasePanel: typeof BaseTabs.Panel;
  BaseIndicator: typeof BaseTabs.Indicator;
}

export const Tabs = TabsRoot as unknown as TabsComponent;
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
Tabs.BaseRoot = BaseTabs.Root;
Tabs.BaseList = BaseTabs.List;
Tabs.BaseTab = BaseTabs.Tab;
Tabs.BasePanel = BaseTabs.Panel;
Tabs.BaseIndicator = BaseTabs.Indicator;

export const KeyedTabs = Tabs;

export default Tabs;
