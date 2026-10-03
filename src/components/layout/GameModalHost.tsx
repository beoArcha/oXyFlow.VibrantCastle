import React from "react";
import { HelpModal } from "@components/help";
import { MenuModal, type MenuModalProps } from "@components/menu/MenuModal";
import { InventoryPanel } from "@components/inventory/InventoryPanel";
import { SkillTreePanel } from "@components/skills/SkillTreePanel";
import { DeveloperModal } from "@components/developer";
import type { ModalType } from "@components/modal";
import type { UseModalManagerResult } from "@components/menu/hooks/useModalManager";

/**
 * Props for the application modal host router.
 */
export interface GameModalHostProps {
  /** Modal state manager instance providing visibility state flags */
  readonly modalManager: Readonly<
    Pick<
      UseModalManagerResult,
      "isHelpOpen" | "isMenuOpen" | "isInventoryOpen" | "isSkillTreeOpen" | "isCreationOpen"
    >
  >;
  /** Callback fired when the active modal requests closing */
  readonly onClose: () => void;
  /** Callback to transition directly between different modal screens */
  readonly onNavigateModal: (targetModal: ModalType) => void;
  /** Callback to resume gameplay and dismiss active modal */
  readonly onResume: () => void;
  /** Callback to initiate key rebind flow from settings */
  readonly onStartRebind?: MenuModalProps["onStartRebind"];
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
  const commonLifecycleProps = {
    onClose,
    onNavigateModal,
    onResume,
  } as const;

  if (modalManager.isHelpOpen) {
    return <HelpModal {...commonLifecycleProps} />;
  }

  if (modalManager.isMenuOpen) {
    return <MenuModal {...commonLifecycleProps} onStartRebind={onStartRebind} />;
  }

  if (modalManager.isInventoryOpen) {
    return <InventoryPanel {...commonLifecycleProps} />;
  }

  if (modalManager.isSkillTreeOpen) {
    return <SkillTreePanel {...commonLifecycleProps} />;
  }

  if (modalManager.isCreationOpen) {
    return <DeveloperModal {...commonLifecycleProps} />;
  }

  return null;
}

