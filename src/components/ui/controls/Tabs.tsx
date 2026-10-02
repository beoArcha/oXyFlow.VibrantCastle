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
  /** Controlled active tab value */
  value?: T;
  /** Uncontrolled default active tab value */
  defaultValue?: T;
  /** Callback fired when active tab changes */
  onValueChange?: (value: T) => void;
  /** Tab orientation (default: "horizontal") */
  orientation?: TabsOrientation;
  /** Legacy array of tab items for 100% backward compatibility */
  items?: TabItem<T>[];
  /** Legacy active tab ID for 100% backward compatibility */
  activeId?: T;
  /** Legacy change callback for 100% backward compatibility */
  onChange?: (id: T) => void;
  /** Optional trailing action slot in legacy items mode */
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
    // Legacy Array Mode: compose TabsList and TabsTrigger primitives without code duplication
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

    // Compound Component Mode: manage controlled/uncontrolled state via TabsContext
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
}

export const Tabs = TabsRoot as unknown as TabsComponent;
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export const KeyedTabs = Tabs;

export * from "./tabs/index";
export default Tabs;
