import React, { useState, useMemo, useCallback } from "react";
import {
  Menu as MenuIcon,
  MapPin,
  User,
  Backpack,
  BookOpen,
  Settings,
  HelpCircle,
  Monitor,
  Volume2,
  Keyboard,
  SlidersHorizontal,
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
import type { SubTabMap } from "@game-menu/menu/hooks/useModalCoordinator";
import { SETTINGS_TAB_REGISTRY, SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import {
  GameplayTab,
  LocationsTab,
  DisplayTab,
  AudioTab,
  InterfaceTab,
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
  readonly onNavigateModal: (modal: ModalType, subTab?: string) => void;
  readonly onResume: () => void;
  readonly onStartRebind: (
    action: keyof InputMap,
    player: PlayerId,
    label: string
  ) => void;
  readonly activeSubTabs?: SubTabMap;
  readonly onSubTabChange?: (modal: OpenModalId, subTab: string) => void;
}

interface GameDialogHeaderMeta {
  readonly titleKey: string;
  readonly subtitleKey: string;
  readonly icon: React.ReactNode;
}

const GAME_DIALOG_HEADER_META: Record<GameModalId, GameDialogHeaderMeta> = {
  [ModalId.Menu]: {
    titleKey: "navGame",
    subtitleKey: "title",
    icon: <MenuIcon className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Locations]: {
    titleKey: "navMap",
    subtitleKey: "selectLocationTitle",
    icon: <MapPin className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Character]: {
    titleKey: "navCharacter",
    subtitleKey: "gameStatsSubtitle",
    icon: <User className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Inventory]: {
    titleKey: "inventoryBtn",
    subtitleKey: "noPauseLive",
    icon: <Backpack className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.SkillTree]: {
    titleKey: "headerSkillTree",
    subtitleKey: "skillTreeSubtitle",
    icon: <BookOpen className="w-5 h-5 text-purple-400" />,
  },
  [ModalId.Settings]: {
    titleKey: "settings",
    subtitleKey: "menuSubtitle",
    icon: <Settings className="w-5 h-5 text-amber-400" />,
  },
  [ModalId.Help]: {
    titleKey: "headerHints",
    subtitleKey: "helpGuideSubtitle",
    icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
  },
};

const SETTINGS_TAB_ICONS: Record<SettingsTabId, React.ReactNode> = {
  [SettingsTabId.Display]: <Monitor size={14} />,
  [SettingsTabId.Audio]: <Volume2 size={14} />,
  [SettingsTabId.Controls]: <Keyboard size={14} />,
  [SettingsTabId.Interface]: <SlidersHorizontal size={14} />,
};

/**
 * Single player-facing dialog shell shared across all game L1 tabs.
 * Keeps the dialog element mounted while switching L1 tabs and keeps header + tab rows fixed.
 * Only Settings renders an L2 tab row.
 */
export const GameMenuDialog: React.FC<GameMenuDialogProps> = ({
  isOpen,
  activeModal,
  onClose,
  onNavigateModal,
  onResume,
  onStartRebind,
  activeSubTabs,
  onSubTabChange,
}) => {
  const { t } = useI18n();
  const [internalSubTabs, setInternalSubTabs] = useState<SubTabMap>({
    [ModalId.Settings]: SettingsTabId.Display,
  });

  const activeSettingsTab = (activeSubTabs?.[ModalId.Settings] ??
    internalSubTabs[ModalId.Settings] ??
    SettingsTabId.Display) as SettingsTabId;

  const handleSettingsTabChange = useCallback(
    (nextTab: SettingsTabId) => {
      if (onSubTabChange) {
        onSubTabChange(ModalId.Settings, nextTab);
      } else {
        setInternalSubTabs((prev) => ({ ...prev, [ModalId.Settings]: nextTab }));
      }
    },
    [onSubTabChange]
  );

  const handleDeepLink = useCallback(
    (modal: ModalType, subTab?: string) => {
      if (subTab !== undefined && !onSubTabChange) {
        setInternalSubTabs((prev) => ({
          ...prev,
          [modal as OpenModalId]: subTab,
        }));
      }
      onNavigateModal(modal, subTab);
    },
    [onNavigateModal, onSubTabChange]
  );

  const settingsTabs = useMemo<TabItem<SettingsTabId>[]>(
    () =>
      SETTINGS_TAB_REGISTRY.map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey),
        icon: SETTINGS_TAB_ICONS[entry.id],
      })),
    [t]
  );

  const settingsTabRenderers = useMemo<Record<SettingsTabId, () => React.ReactNode>>(
    () => ({
      [SettingsTabId.Display]: () => <DisplayTab />,
      [SettingsTabId.Audio]: () => <AudioTab />,
      [SettingsTabId.Controls]: () => <ControlsMenuTab onStartRebind={onStartRebind} />,
      [SettingsTabId.Interface]: () => <InterfaceTab />,
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
        return <GameplayTab />;
      case ModalId.Locations:
        return <LocationsTab />;
      case ModalId.Character:
        return <StatsMenuTab />;
      case ModalId.Inventory:
        return <InventoryModalView />;
      case ModalId.SkillTree:
        return <SkillTreeView />;
      case ModalId.Settings:
        return settingsTabRenderers[activeSettingsTab]();
      case ModalId.Help:
        return (
          <HelpModalView
            onOpenControls={() =>
              handleDeepLink(ModalId.Settings, SettingsTabId.Controls)
            }
          />
        );
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
          {currentGameModal === ModalId.Settings && (
            <Tabs<SettingsTabId>
              id="settings-sub-navigation"
              items={settingsTabs}
              activeId={activeSettingsTab}
              onChange={handleSettingsTabChange}
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
