import { useEffect } from "react";
import { APP_CONFIG } from "@/app/appConfig";
import {
  ModalId,
  findModalByHotkey,
  isGameModal,
  type OpenModalId,
} from "@game-menu/modal/modalRegistry";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";

export interface UseAppHotkeysOptions {
  readonly modalManager: ModalManager;
  readonly onToggleModal: (modal: OpenModalId) => void;
  readonly onCloseModal: () => void;
  readonly onOpenDefaultEscapeModal: () => void;
  readonly onTogglePause: () => void;
  readonly onStepL1Tab?: (delta: -1 | 1) => void;
  readonly onStepL2Tab?: (delta: -1 | 1) => void;
  readonly isRebinding?: boolean;
}

const INPUT_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isNestedDialogOpen(): boolean {
  if (typeof document === "undefined" || !document.body) return false;
  return (
    document.body.querySelectorAll('[role="dialog"], [role="alertdialog"]').length > 1 ||
    document.body.querySelector('[data-slot="dialog-content"]') !== null
  );
}

/**
 * Registry-driven global keyboard shortcut dispatcher (OCP).
 * Resolves modal shortcuts dynamically from MODAL_REGISTRY and APP_CONFIG.
 */
export function useAppHotkeys({
  modalManager,
  onToggleModal,
  onCloseModal,
  onOpenDefaultEscapeModal,
  onTogglePause,
  onStepL1Tab,
  onStepL2Tab,
  isRebinding = false,
}: UseAppHotkeysOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRebinding) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (INPUT_TAG_NAMES.has(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const isGameOpen = isGameModal(modalManager.activeModal);
      const nestedOpen = isNestedDialogOpen();

      if (e.key === APP_CONFIG.globalKeys.escape) {
        if (nestedOpen) return;
        e.preventDefault();
        if (modalManager.activeModal !== ModalId.None) {
          onCloseModal();
        } else {
          onOpenDefaultEscapeModal();
        }
        return;
      }

      if (nestedOpen) return;

      const lowerKey = e.key.toLowerCase();

      if (lowerKey === APP_CONFIG.globalKeys.pause) {
        if (modalManager.activeModal === ModalId.Creation) return;
        e.preventDefault();
        onTogglePause();
        return;
      }

      if (isGameOpen) {
        if (lowerKey === "q") {
          e.preventDefault();
          onStepL1Tab?.(-1);
          return;
        }
        if (lowerKey === "e") {
          e.preventDefault();
          onStepL1Tab?.(1);
          return;
        }
        if (e.key === "[") {
          e.preventDefault();
          onStepL2Tab?.(-1);
          return;
        }
        if (e.key === "]") {
          e.preventDefault();
          onStepL2Tab?.(1);
          return;
        }
      }

      const matchedModal = findModalByHotkey(e.key);
      if (matchedModal) {
        if (isGameOpen && matchedModal.id === ModalId.Creation) return;
        e.preventDefault();
        onToggleModal(matchedModal.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    modalManager.activeModal,
    onToggleModal,
    onCloseModal,
    onOpenDefaultEscapeModal,
    onTogglePause,
    onStepL1Tab,
    onStepL2Tab,
    isRebinding,
  ]);
}
