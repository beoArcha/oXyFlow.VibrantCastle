import React from "react";
import { HelpModal } from "@components/help/HelpModal";
import { MenuModal } from "@components/menu/MenuModal";
import { InventoryPanel } from "@components/inventory/InventoryPanel";
import { SkillTreePanel } from "@components/skills/SkillTreePanel";
import { DeveloperModal } from "@components/developer";
import { ModalType } from "@ui";
import { PlayerId, InputMap } from "@game/types";
import { UseModalManagerResult } from "@components/menu/hooks/useModalManager";

/**
 * Props for the application modal host router.
 */
export interface GameModalHostProps {
  /** Modal state manager instance providing visibility state flags */
  modalManager: Pick<
    UseModalManagerResult,
    "isHelpOpen" | "isMenuOpen" | "isInventoryOpen" | "isSkillTreeOpen" | "isCreationOpen"
  >;
  /** Callback fired when the active modal requests closing */
  onClose: () => void;
  /** Callback to transition directly between different modal screens */
  onNavigateModal: (targetModal: ModalType) => void;
  /** Callback to resume gameplay and dismiss active modal */
  onResume: () => void;
  /** Callback to initiate key rebind flow from settings */
  onStartRebind?: (action: keyof InputMap, player: PlayerId, label: string) => void;
}

/**
 * Central host component responsible for conditionally rendering the active modal panel.
 * Encapsulates modal switching logic and passes standardized lifecycle callbacks.
 *
 * @example
 * <GameModalHost
 *   modalManager={modalManager}
 *   onClose={handleClose}
 *   onNavigateModal={handleNavigate}
 *   onResume={handleResume}
 *   onStartRebind={handleRebind}
 * />
 */
export function GameModalHost({
  modalManager,
  onClose,
  onNavigateModal,
  onResume,
  onStartRebind,
}: GameModalHostProps): React.ReactElement | null {
  if (modalManager.isHelpOpen) {
    return (
      <HelpModal
        onClose={onClose}
        onNavigateModal={onNavigateModal}
        onResume={onResume}
      />
    );
  }

  if (modalManager.isMenuOpen) {
    return (
      <MenuModal
        onClose={onClose}
        onStartRebind={onStartRebind}
        onNavigateModal={onNavigateModal}
        onResume={onResume}
      />
    );
  }

  if (modalManager.isInventoryOpen) {
    return (
      <InventoryPanel
        onClose={onClose}
        onNavigateModal={onNavigateModal}
        onResume={onResume}
      />
    );
  }

  if (modalManager.isSkillTreeOpen) {
    return (
      <SkillTreePanel
        onClose={onClose}
        onNavigateModal={onNavigateModal}
        onResume={onResume}
      />
    );
  }

  if (modalManager.isCreationOpen) {
    return (
      <DeveloperModal
        onClose={onClose}
        onNavigateModal={onNavigateModal}
        onResume={onResume}
      />
    );
  }

  return null;
}
