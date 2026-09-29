import { useEffect } from "react";
import { ActiveModal } from "@components/menu/hooks/useModalManager";

export interface AppHotkeysModalManager {
  activeModal: ActiveModal;
  isMenuOpen: boolean;
  isHelpOpen: boolean;
  isInventoryOpen: boolean;
  isSkillTreeOpen: boolean;
  isCreationOpen: boolean;
  openMenu: () => void;
  openHelp: () => void;
  openInventory: () => void;
  openSkillTree: () => void;
  openCreation: () => void;
  closeModal: () => void;
}

export interface UseAppHotkeysOptions {
  modalManager: AppHotkeysModalManager;
  onOpenHelp: () => void;
  onOpenMenu: () => void;
  onOpenCreation: () => void;
  onCloseModal: () => void;
  onTogglePause: () => void;
  isRebinding?: boolean;
  onCancelRebind?: () => void;
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts listener for Vibrant Castle application.
 * Manages modal toggling, game pause hotkey, and escape key hierarchy.
 *
 * @example
 * ```tsx
 * useAppHotkeys({
 *   modalManager,
 *   onOpenHelp: handleOpenHelp,
 *   onOpenMenu: handleOpenMenu,
 *   onOpenCreation: handleOpenCreation,
 *   onCloseModal: handleCloseModal,
 *   onTogglePause: handleTogglePause,
 *   isRebinding: keyRebind.isRebinding,
 *   onCancelRebind: keyRebind.cancelRebind,
 * });
 * ```
 */
export function useAppHotkeys({
  modalManager,
  onOpenHelp,
  onOpenMenu,
  onOpenCreation,
  onCloseModal,
  onTogglePause,
  isRebinding = false,
  onCancelRebind,
  enabled = true,
}: UseAppHotkeysOptions): void {
  useEffect(() => {
    if (!enabled || isRebinding) {
      return;
    }

    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Help Modal shortcut: 'h', 'H', '?', 'F1'
      if (e.key === "h" || e.key === "H" || e.key === "?" || e.key === "F1") {
        e.preventDefault();
        if (modalManager.isHelpOpen) {
          onCloseModal();
        } else {
          onOpenHelp();
        }
        return;
      }

      // Menu Modal shortcut: 'm' or 'M'
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (modalManager.isMenuOpen) {
          onCloseModal();
        } else {
          onOpenMenu();
        }
        return;
      }

      // Creation / Developer Modal shortcut: 'c' or 'C'
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (modalManager.isCreationOpen) {
          onCloseModal();
        } else {
          onOpenCreation();
        }
        return;
      }

      // Pause toggle: 'p' or 'P' (closes active modal or toggles game pause)
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        onTogglePause();
        return;
      }

      // Inventory shortcut: 'i' or 'I' (does NOT pause game)
      if (e.key === "i" || e.key === "I") {
        if (modalManager.isInventoryOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openInventory();
        }
        return;
      }

      // Skill tree shortcut: 'k' or 'K' (does NOT pause game)
      if (e.key === "k" || e.key === "K") {
        if (modalManager.isSkillTreeOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openSkillTree();
        }
        return;
      }

      // Escape key: closes open modal, cancels rebind, or opens menu
      if (e.key === "Escape") {
        e.preventDefault();
        if (modalManager.activeModal !== "none") {
          onCloseModal();
          onCancelRebind?.();
        } else {
          onOpenMenu();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [
    enabled,
    isRebinding,
    modalManager,
    onOpenHelp,
    onOpenMenu,
    onOpenCreation,
    onCloseModal,
    onTogglePause,
    onCancelRebind,
  ]);
}
