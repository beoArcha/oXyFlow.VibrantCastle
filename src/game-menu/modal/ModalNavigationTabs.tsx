import React from "react";
import { Menu as MenuIcon, HelpCircle, Backpack, BookOpen, Layers } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Tabs, TabItem } from "@ui";
import {
  ModalId,
  getNavigationModalDefinitions,
  type ModalIconKey,
  type ModalType,
} from "./modalRegistry";

export type { ModalType };

export interface ModalNavigationTabsProps {
  currentModal: ModalType;
  onNavigate: (modal: ModalType) => void;
  showCreation?: boolean;
  wrap?: boolean;
  className?: string;
}

const MODAL_NAV_ICONS: Record<ModalIconKey, React.ReactNode> = {
  menu: <MenuIcon size={14} className="text-amber-400 shrink-0" />,
  help: <HelpCircle size={14} className="text-amber-400 shrink-0" />,
  inventory: <Backpack size={14} className="text-amber-400 shrink-0" />,
  skillTree: <BookOpen size={14} className="text-purple-400 shrink-0" />,
  creation: <Layers size={14} className="text-emerald-400 shrink-0" />,
};

/**
 * Registry-driven L1 modal navigation bar delegating layout, tablist semantics,
 * and shortcut badges to Tabs.
 */
export const ModalNavigationTabs: React.FC<ModalNavigationTabsProps> = React.memo(
  function ModalNavigationTabs({
    currentModal,
    onNavigate,
    showCreation = true,
    wrap = false,
    className = "",
  }) {
    const { t } = useI18n();

    const items: TabItem<ModalType>[] = React.useMemo(
      () =>
        getNavigationModalDefinitions()
          .filter((def) => showCreation || def.id !== ModalId.Creation)
          .map((def) => ({
            id: def.id,
            label: t(def.navigationTab.labelKey),
            keyLabel: def.navigationTab.keyLabel,
            icon: MODAL_NAV_ICONS[def.navigationTab.iconKey],
          })),
      [t, showCreation]
    );

    return (
      <Tabs<ModalType>
        id="modal-quick-navigation"
        items={items}
        activeId={currentModal}
        onChange={onNavigate}
        wrap={wrap}
        className={className}
      />
    );
  }
);

ModalNavigationTabs.displayName = "ModalNavigationTabs";

export default ModalNavigationTabs;
