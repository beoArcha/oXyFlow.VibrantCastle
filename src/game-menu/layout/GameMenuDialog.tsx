import React, { useState, useMemo, useCallback } from "react";
import {
  Menu as MenuIcon,
  HelpCircle,
  Backpack,
  BookOpen,
  Gamepad2,
  MapPin,
  Monitor,
  Volume2,
  BarChart3,
  Keyboard,
} from "lucide-react";
import { Modal, Tabs, TabItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import { InputMap, PlayerId } from "@game/types";
import {
  ModalNavigationTabs,
  ResumeButton,
  ModalId,
  GAME_MODAL_WIDTH_CLASS,
  isGameModal,
  type ModalType,
  type OpenModalId,
} from "@game-menu/modal";
import type { ActiveModalState } from "@game-menu/menu/hooks/useModalManager";
import { MENU_TAB_REGISTRY, MenuTabId } from "@game-menu/menu/menuTabRegistry";
import {
  GameplayTab,
  LocationsTab,
  DisplayTab,
  AudioTab,
} from "@game-menu/menu/tabs";
import { SkillTreeView } from "@game-menu/skills/SkillTreeView";
import { ControlsMenuTab } from "@game-menu/modal/views/ControlsMenuTab";
import { StatsMenuTab } from "@game-menu/modal/views/StatsMenuTab";
import { HelpModalView } from "@game-menu/modal/views/HelpModalView";
import { InventoryModalView } from "@game-menu/modal/views/InventoryModalView";

export type GameModalId = Exclude<OpenModalId, ModalId.Creation>;

export interface GameMenuDialogProps {
  readonly isOpen?: boolean;
  readonly activeModal: ActiveModalState;
  readonly onClose: () => void;
  readonly onNavigateModal: (modal: ModalType) => void;
  readonly onResume: () => void;
  readonly onStartRebind: (
    action: keyof InputMap,
    player: PlayerId,
    label: string
  ) => void;
  readonly menuTab?: MenuTabId;
  readonly onMenuTabChange?: (tab: MenuTabId) => void;
}

interface GameDialogHeaderMeta {
  readonly titleKey: string;
  readonly subtitleKey: string;
  readonly icon: React.ReactNode;
}

const GAME_DIALOG_HEADER_META: Record<GameModalId, GameDialogHeaderMeta> = {
  [ModalId.Menu]: {
    titleKey: "menu",
    subtitleKey: "title",
    icon: <MenuIcon className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Help]: {
    titleKey: "helpModalTitle",
    subtitleKey: "helpGuideSubtitle",
    icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Inventory]: {
    titleKey: "inventoryTitle",
    subtitleKey: "noPauseLive",
    icon: <Backpack className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.SkillTree]: {
    titleKey: "skillTreeTitle",
    subtitleKey: "skillTreeSubtitle",
    icon: <BookOpen className="w-5 h-5 text-purple-400" />,
  },
};

const MENU_TAB_ICONS: Record<MenuTabId, React.ReactNode> = {
  [MenuTabId.Gameplay]: <Gamepad2 size={14} />,
  [MenuTabId.Locations]: <MapPin size={14} />,
  [MenuTabId.Display]: <Monitor size={14} />,
  [MenuTabId.Audio]: <Volume2 size={14} />,
  [MenuTabId.Controls]: <Keyboard size={14} />,
  [MenuTabId.Stats]: <BarChart3 size={14} />,
};

/**
 * Single player-facing dialog shell shared across Menu, Help, Inventory, and SkillTree.
 * Keeps the dialog element mounted while switching L1 tabs and keeps header + tab rows fixed.
 */
export const GameMenuDialog: React.FC<GameMenuDialogProps> = ({
  isOpen,
  activeModal,
  onClose,
  onNavigateModal,
  onResume,
  onStartRebind,
  menuTab: controlledMenuTab,
  onMenuTabChange,
}) => {
  const { t } = useI18n();
  const [internalMenuTab, setInternalMenuTab] = useState<MenuTabId>(MenuTabId.Gameplay);
  const activeMenuTab = controlledMenuTab ?? internalMenuTab;
  const handleMenuTabChange = useCallback(
    (nextTab: MenuTabId) => {
      if (onMenuTabChange) {
        onMenuTabChange(nextTab);
      } else {
        setInternalMenuTab(nextTab);
      }
    },
    [onMenuTabChange]
  );

  const menuTabs = useMemo<TabItem<MenuTabId>[]>(
    () =>
      MENU_TAB_REGISTRY.map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey) || entry.id,
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
    }),
    [onStartRebind]
  );

  const gameModalOpen = (isOpen ?? true) && isGameModal(activeModal);
  const currentGameModal = (
    isGameModal(activeModal) ? activeModal : ModalId.Menu
  ) as GameModalId;
  const headerMeta = GAME_DIALOG_HEADER_META[currentGameModal];

  const renderBody = (): React.ReactNode => {
    switch (currentGameModal) {
      case ModalId.Menu:
        return menuTabRenderers[activeMenuTab]();
      case ModalId.Help:
        return <HelpModalView />;
      case ModalId.Inventory:
        return <InventoryModalView />;
      case ModalId.SkillTree:
        return <SkillTreeView />;
    }
  };

  return (
    <Modal isOpen={gameModalOpen} onClose={onClose}>
      <Modal.Content
        maxWidthClass={GAME_MODAL_WIDTH_CLASS}
        className="h-[min(85vh,760px)] md:h-[min(85vh,760px)] md:max-h-[760px]"
      >
        <Modal.Header
          title={t(headerMeta.titleKey)}
          subtitle={t(headerMeta.subtitleKey)}
          icon={headerMeta.icon}
          headerRight={<ResumeButton onResume={onResume} />}
        />

        <div className="shrink-0 px-4 md:px-6 pt-3 pb-2 border-b border-amber-900/30 bg-surface-darkest/50 flex flex-col gap-2">
          <ModalNavigationTabs
            currentModal={currentGameModal}
            onNavigate={onNavigateModal}
            showCreation={false}
            wrap={false}
          />
          {currentGameModal === ModalId.Menu && (
            <Tabs<MenuTabId>
              items={menuTabs}
              activeId={activeMenuTab}
              onChange={handleMenuTabChange}
              wrap={false}
            />
          )}
        </div>

        <Modal.Body>{renderBody()}</Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

GameMenuDialog.displayName = "GameMenuDialog";
export default GameMenuDialog;
