import React from "react";
import { Keyboard, Swords, Compass, LayoutGrid } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { HelpTab } from "./types";
import { cn } from "@lib/utils";

export interface HelpNavigationProps {
  activeTab: HelpTab;
  onSelectTab: (tab: HelpTab) => void;
  className?: string;
}

/**
 * Filter and navigation controls for Help sections.
 * Allows instant focal inspection or viewing all guidelines at once.
 */
export const HelpNavigation: React.FC<HelpNavigationProps> = ({
  activeTab,
  onSelectTab,
  className = "",
}) => {
  const { t } = useI18n();

  const tabs: { id: HelpTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: t("tabAllSections"), icon: <LayoutGrid size={13} /> },
    { id: "shortcuts", label: t("controlsHelp"), icon: <Keyboard size={13} /> },
    { id: "controls", label: t("combatAndMovement"), icon: <Swords size={13} /> },
    { id: "mechanics", label: t("tipsMechanics"), icon: <Compass size={13} /> },
  ];

  return (
    <nav
      className={cn("flex flex-wrap gap-2 pb-1 border-b border-[#4a200e]/60", className)}
      aria-label="Help sections"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              isActive
                ? "bg-amber-600/90 text-white shadow-md border border-amber-400"
                : "bg-[#1c0c07] text-stone-300 hover:text-amber-300 hover:bg-[#2a130a] border border-[#4a200e]"
            )}
            aria-pressed={isActive}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default HelpNavigation;
