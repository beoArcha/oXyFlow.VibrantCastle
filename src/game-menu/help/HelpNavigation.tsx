import React, { useMemo } from "react";
import { Keyboard, Swords, Compass, LayoutGrid } from "lucide-react";
import { Tabs, TabItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { HelpTab, HelpNavigationProps } from "./types";

export type { HelpNavigationProps };

/**
 * Filter and navigation controls for Help sections.
 * Composes standard Tabs primitive with localized help section items.
 */
export const HelpNavigation: React.FC<HelpNavigationProps> = React.memo(
  function HelpNavigation({ activeTab, onSelectTab, className = "" }) {
    const { t } = useI18n();

    const items: TabItem<HelpTab>[] = useMemo(
      () => [
        { id: "all", label: t("tabAllSections"), icon: <LayoutGrid size={13} /> },
        { id: "shortcuts", label: t("controlsHelp"), icon: <Keyboard size={13} /> },
        { id: "controls", label: t("combatAndMovement"), icon: <Swords size={13} /> },
        { id: "mechanics", label: t("tipsMechanics"), icon: <Compass size={13} /> },
      ],
      [t]
    );

    return (
      <div className={cn("w-full border-b border-amber-900/40 pb-1", className)}>
        <Tabs<HelpTab>
          items={items}
          activeId={activeTab}
          onChange={(newId) => onSelectTab(newId as HelpTab)}
        />
      </div>
    );
  }
);

HelpNavigation.displayName = "HelpNavigation";

export default HelpNavigation;
