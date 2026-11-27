import React, { useState } from "react";
import { Layers } from "lucide-react";
import { Modal } from "@ui";
import { useI18n } from "@context/I18nContext";
import { InputMap, PlayerId } from "@game/types";
import { ModalId, isGameModal, type ModalType } from "@game-menu/modal";
import { LanguageSelector } from "@game-menu/common";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";
import { MenuTabId } from "@game-menu/menu/menuTabRegistry";
import { GameMenuDialog } from "./GameMenuDialog";

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

/**
 * Clean OCP/DIP modal host dispatching player-facing tabs into the single GameMenuDialog shell
 * and keeping the DeveloperSuite isolated inside ModalId.Creation (key C).
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
  const isGameOpen = isGameModal(modalManager.activeModal);

  if (modalManager.activeModal === ModalId.Creation) {
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
        <div className="flex flex-col gap-4">{renderDeveloperSuite()}</div>
      </Modal>
    );
  }

  return (
    <GameMenuDialog
      isOpen={isGameOpen}
      activeModal={modalManager.activeModal}
      menuTab={menuTab}
      onMenuTabChange={setMenuTab}
      onClose={onClose}
      onNavigateModal={onNavigateModal}
      onResume={onResume}
      onStartRebind={onStartRebind}
    />
  );
};

GameModalHost.displayName = "GameModalHost";
export default GameModalHost;
