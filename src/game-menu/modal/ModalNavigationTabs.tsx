import React from "react";
import { Menu as MenuIcon, HelpCircle, Backpack, BookOpen, Play, Layers } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Tabs, TabItem, Button, Text, Code } from "@ui";

export type ModalType = "menu" | "help" | "inventory" | "skillTree" | "creation";

export interface ModalNavigationTabsProps {
  currentModal: ModalType;
  onNavigate: (modal: ModalType) => void;
  onResume: () => void;
  showCreation?: boolean;
  className?: string;
}

/**
 * Specialized game modal navigation bar delegating layout, tablist semantics,
 * and shortcut badges to KeyedTabs.
 */
export const ModalNavigationTabs: React.FC<ModalNavigationTabsProps> = React.memo(
  function ModalNavigationTabs({
    currentModal,
    onNavigate,
    onResume,
    showCreation = true,
    className = "",
  }) {
    const { t } = useI18n();

    const items: TabItem<ModalType>[] = React.useMemo(() => {
      const list: TabItem<ModalType>[] = [
        {
          id: "menu",
          label: t("menu"),
          keyLabel: "M",
          icon: <MenuIcon size={14} className="text-amber-400 shrink-0" />,
        },
        {
          id: "help",
          label: t("hints"),
          keyLabel: "H",
          icon: <HelpCircle size={14} className="text-amber-400 shrink-0" />,
        },
        {
          id: "inventory",
          label: t("inventoryBtn"),
          keyLabel: "I",
          icon: <Backpack size={14} className="text-amber-400 shrink-0" />,
        },
        {
          id: "skillTree",
          label: t("skillTreeBtn"),
          keyLabel: "K",
          icon: <BookOpen size={14} className="text-purple-400 shrink-0" />,
        },
      ];

      if (showCreation) {
        list.push({
          id: "creation",
          label: t("tabCreation"),
          keyLabel: "C",
          icon: <Layers size={14} className="text-emerald-400 shrink-0" />,
        });
      }

      return list;
    }, [t, showCreation]);

    const resumeAction = (
      <Button
        variant="ghost"
        size="sm"
        onClick={onResume}
        className="gap-1.5 px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-600/60 transition-all shadow-md hover:shadow-emerald-900/40 ml-auto focus-visible:ring-emerald-400"
        title={`${t("resume")} [P]`}
        aria-label={`${t("resume")} [P]`}
      >
        <Play size={13} className="text-emerald-400 fill-emerald-400 shrink-0" />
        <Text size="xs" weight="bold">{t("resume")}</Text>
        <Code size="xs" className="text-[10px] bg-emerald-900/90 text-emerald-300 px-1 py-0.5 rounded leading-none border-0">
          [P]
        </Code>
      </Button>
    );

    return (
      <Tabs<ModalType>
        id="modal-quick-navigation"
        items={items}
        activeId={currentModal}
        onChange={onNavigate}
        trailingAction={resumeAction}
        className={className}
      />
    );
  }
);

ModalNavigationTabs.displayName = "ModalNavigationTabs";

export default ModalNavigationTabs;
