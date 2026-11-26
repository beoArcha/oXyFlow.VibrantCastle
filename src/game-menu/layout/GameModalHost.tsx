import React, { useState, useMemo } from "react";
import {
  Menu as MenuIcon,
  HelpCircle,
  Backpack,
  Layers,
  Gamepad2,
  MapPin,
  Monitor,
  Volume2,
  BarChart3,
  Keyboard,
  Wrench,
} from "lucide-react";
import { Modal, Tabs, TabItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import { InputMap, PlayerId } from "@game/types";
import { ModalNavigationTabs, ModalId, type ModalType } from "@game-menu/modal";
import { LanguageSelector } from "@game-menu/common";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";
import { MENU_TAB_REGISTRY, MenuTabId } from "@game-menu/menu/menuTabRegistry";
import {
  GameplayTab,
  LocationsTab,
  DisplayTab,
  AudioTab,
} from "@game-menu/menu/tabs";
import { SkillTreePanel } from "@game-menu/skills/SkillTreePanel";
import { ControlsMenuTab } from "@game-menu/modal/views/ControlsMenuTab";
import { StatsMenuTab } from "@game-menu/modal/views/StatsMenuTab";
import { HelpModalView } from "@game-menu/modal/views/HelpModalView";
import { InventoryModalView } from "@game-menu/modal/views/InventoryModalView";

export interface GameModalHostProps {
  readonly modalManager: ModalManager;
  readonly onClose: () => void;
  readonly onNavigateModal: (modal: ModalType) => void;
  readonly onResume: () => void;
  readonly onStartRebind: (
    action: keyof InputMap,
    player: PlayerId,
    label: string
  ) => void;
  /**
   * Injected Creation & Developer Suite renderer (DIP — keeps src/game-menu decoupled from src/developer).
   */
  readonly renderDeveloperSuite: () => React.ReactNode;
}

const MENU_TAB_ICONS: Record<MenuTabId, React.ReactNode> = {
  [MenuTabId.Gameplay]: <Gamepad2 size={14} />,
  [MenuTabId.Locations]: <MapPin size={14} />,
  [MenuTabId.Display]: <Monitor size={14} />,
  [MenuTabId.Audio]: <Volume2 size={14} />,
  [MenuTabId.Controls]: <Keyboard size={14} />,
  [MenuTabId.Stats]: <BarChart3 size={14} />,
  [MenuTabId.Developer]: <Wrench size={14} className="text-emerald-400" />,
};

/**
 * Clean OCP/DIP modal host dispatching overlays via ModalId and MenuTabId registries.
 * Exposes the full DeveloperSuite both in ModalId.Creation and in Menu -> MenuTabId.Developer.
 */
export const GameModalHost: React.FC<GameModalHostProps> = ({
  modalManager,
  onClose,
  onNavigateModal,
  onResume,
  onStartRebind,
  renderDeveloperSuite,
}) => {
  const { t } = useI18n();
  const [menuTab, setMenuTab] = useState<MenuTabId>(MenuTabId.Gameplay);

  const menuTabs = useMemo<TabItem<MenuTabId>[]>(
    () =>
      MENU_TAB_REGISTRY.map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey) || entry.fallbackLabel || entry.id,
        icon: MENU_TAB_ICONS[entry.id],
      })),
    [t]
  );

  const menuTabRenderers = useMemo<Record<MenuTabId, () => React.ReactNode>>(
    () => ({
      [MenuTabId.Gameplay]: () => <GameplayTab />,
      [MenuTabId.Locations]: () => <LocationsTab />,
      [MenuTabId.Display]: () => <DisplayTab />,
      [MenuTabId.Audio]: () => <AudioTab />,
      [MenuTabId.Controls]: () => <ControlsMenuTab onStartRebind={onStartRebind} />,
      [MenuTabId.Stats]: () => <StatsMenuTab />,
      [MenuTabId.Developer]: () => renderDeveloperSuite(),
    }),
    [onStartRebind, renderDeveloperSuite]
  );

  if (modalManager.activeModal === ModalId.None) {
    return null;
  }

  switch (modalManager.activeModal) {
    case ModalId.SkillTree:
      return (
        <SkillTreePanel
          onClose={onClose}
          onNavigateModal={onNavigateModal}
          onResume={onResume}
        />
      );

    case ModalId.Menu:
      return (
        <Modal
          isOpen={true}
          onClose={onClose}
          title={t("menu")}
          subtitle={t("title")}
          icon={<MenuIcon className="w-5 h-5 text-amber-400" />}
          headerRight={<LanguageSelector />}
          maxWidthClass={menuTab === MenuTabId.Developer ? "max-w-7xl" : "max-w-5xl"}
        >
          <div className="flex flex-col gap-4">
            <ModalNavigationTabs
              currentModal={ModalId.Menu}
              onNavigate={onNavigateModal}
              onResume={onResume}
            />
            <Tabs<MenuTabId>
              items={menuTabs}
              activeId={menuTab}
              onChange={setMenuTab}
            />
            {menuTabRenderers[menuTab]()}
          </div>
        </Modal>
      );

    case ModalId.Help:
      return (
        <Modal
          isOpen={true}
          onClose={onClose}
          title={t("helpModalTitle")}
          subtitle={t("helpGuideSubtitle")}
          icon={<HelpCircle className="w-5 h-5 text-amber-400" />}
          headerRight={<LanguageSelector />}
          maxWidthClass="max-w-4xl"
        >
          <div className="flex flex-col gap-4">
            <ModalNavigationTabs
              currentModal={ModalId.Help}
              onNavigate={onNavigateModal}
              onResume={onResume}
            />
            <HelpModalView />
          </div>
        </Modal>
      );

    case ModalId.Inventory:
      return (
        <Modal
          isOpen={true}
          onClose={onClose}
          title={t("inventoryTitle")}
          subtitle={t("noPauseLive")}
          icon={<Backpack className="w-5 h-5 text-amber-400" />}
          headerRight={<LanguageSelector />}
          maxWidthClass="max-w-5xl"
        >
          <div className="flex flex-col gap-4">
            <ModalNavigationTabs
              currentModal={ModalId.Inventory}
              onNavigate={onNavigateModal}
              onResume={onResume}
            />
            <InventoryModalView />
          </div>
        </Modal>
      );

    case ModalId.Creation:
      return (
        <Modal
          isOpen={true}
          onClose={onClose}
          title={t("creationTitle")}
          subtitle={t("creationSubtitle")}
          icon={<Layers className="w-5 h-5 text-emerald-400" />}
          headerRight={<LanguageSelector />}
          maxWidthClass="max-w-7xl"
        >
          <div className="flex flex-col gap-4">
            <ModalNavigationTabs
              currentModal={ModalId.Creation}
              onNavigate={onNavigateModal}
              onResume={onResume}
            />
            {renderDeveloperSuite()}
          </div>
        </Modal>
      );

    default:
      return null;
  }
};

GameModalHost.displayName = "GameModalHost";
export default GameModalHost;
