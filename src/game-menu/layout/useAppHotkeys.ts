import { useEffect } from "react";
import { APP_CONFIG } from "@/app/appConfig";
import {
  ModalId,
  findModalByHotkey,
  type OpenModalId,
} from "@game-menu/modal/modalRegistry";
import type { ModalManager } from "@game-menu/menu/hooks/useModalManager";

export interface UseAppHotkeysOptions {
  readonly modalManager: ModalManager;
  readonly onToggleModal: (modal: OpenModalId) => void;
  readonly onCloseModal: () => void;
  readonly onOpenDefaultEscapeModal: () => void;
  readonly onTogglePause: () => void;
  readonly isRebinding?: boolean;
}

const INPUT_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

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

      if (e.key === APP_CONFIG.globalKeys.escape) {
        e.preventDefault();
        if (modalManager.activeModal !== ModalId.None) {
          onCloseModal();
        } else {
          onOpenDefaultEscapeModal();
        }
        return;
      }

      if (e.key.toLowerCase() === APP_CONFIG.globalKeys.pause) {
        e.preventDefault();
        onTogglePause();
        return;
      }

      const matchedModal = findModalByHotkey(e.key);
      if (matchedModal) {
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
    isRebinding,
  ]);
}
