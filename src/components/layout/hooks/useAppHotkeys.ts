import { useEffect } from "react";
import type { UseModalManagerResult } from "@components/menu/hooks/useModalManager";

/**
 * Modal manager interface subset for global hotkeys.
 * Contains only properties and methods directly consumed by useAppHotkeys.
 */
export type AppHotkeysModalManager = Readonly<
  Pick<
    UseModalManagerResult,
    | "activeModal"
    | "isMenuOpen"
    | "isHelpOpen"
    | "isInventoryOpen"
    | "isSkillTreeOpen"
    | "isCreationOpen"
    | "openInventory"
    | "openSkillTree"
    | "closeModal"
  >
>;

/**
 * Options contract for the global application hotkeys hook.
 */
export interface UseAppHotkeysOptions {
  readonly modalManager: AppHotkeysModalManager;
  readonly onOpenHelp: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenCreation: () => void;
  readonly onCloseModal: () => void;
  readonly onTogglePause: () => void;
  readonly isRebinding?: boolean;
  /** @deprecated Key rebind lifecycle is handled directly within useKeyRebind */
  readonly onCancelRebind?: () => void;
  readonly enabled?: boolean;
}

/**
 * Global keyboard shortcuts listener for Vibrant Castle application.
 * Manages modal toggling, game pause hotkey, and escape key hierarchy.
 * Automatically ignores modifier combinations to prevent browser shortcut collisions.
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
  enabled = true,
}: UseAppHotkeysOptions): void {
  useEffect(() => {
    if (!enabled || isRebinding) {
      return;
    }

    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Ignore key events when modifier keys are pressed (avoids hijacking browser shortcuts like Ctrl+C, Ctrl+P, Alt+Tab)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Ignore key events when typing inside text fields or editable content
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Help Modal: 'h', 'H', '?', 'F1'
      if (e.key === "h" || e.key === "H" || e.key === "?" || e.key === "F1") {
        e.preventDefault();
        if (modalManager.isHelpOpen) {
          onCloseModal();
        } else {
          onOpenHelp();
        }
        return;
      }

      // Menu Modal: 'm', 'M'
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (modalManager.isMenuOpen) {
          onCloseModal();
        } else {
          onOpenMenu();
        }
        return;
      }

      // Creation / Developer Modal: 'c', 'C'
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (modalManager.isCreationOpen) {
          onCloseModal();
        } else {
          onOpenCreation();
        }
        return;
      }

      // Pause toggle: 'p', 'P'
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        onTogglePause();
        return;
      }

      // Inventory panel toggle: 'i', 'I'
      if (e.key === "i" || e.key === "I") {
        if (modalManager.isInventoryOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openInventory();
        }
        return;
      }

      // Skill tree toggle: 'k', 'K'
      if (e.key === "k" || e.key === "K") {
        if (modalManager.isSkillTreeOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openSkillTree();
        }
        return;
      }

      // Escape: closes open modal or opens menu
      if (e.key === "Escape") {
        e.preventDefault();
        if (modalManager.activeModal !== "none") {
          onCloseModal();
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
  ]);
}

