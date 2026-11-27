import { useCallback, useMemo, useRef } from "react";
import {
  ModalId,
  doesModalPauseGame,
  isGameModal,
  type ModalType,
  type OpenModalId,
} from "@game-menu/modal/modalRegistry";
import { useModalManager, type ModalManager } from "./useModalManager";

export interface UseModalCoordinatorOptions {
  readonly setPaused: (paused: boolean) => void;
  readonly togglePause: () => void;
}

export interface ModalCoordinator {
  readonly modalManager: ModalManager;
  readonly openModal: (modal: OpenModalId | ModalType) => void;
  readonly openLastGameModal: () => void;
  readonly toggleModal: (modal: OpenModalId | ModalType) => void;
  readonly closeModal: () => void;
  readonly resumeGame: () => void;
  readonly togglePause: () => void;
}

/**
 * Single-responsibility coordinator synchronizing modal transitions with engine pause state
 * strictly via MODAL_REGISTRY metadata (OCP — zero hardcoded modal conditionals).
 * Tracks the last-used player-facing L1 tab in session memory so Esc reopens it.
 */
export function useModalCoordinator({
  setPaused,
  togglePause: engineTogglePause,
}: UseModalCoordinatorOptions): ModalCoordinator {
  const modalManager = useModalManager(ModalId.None);
  const lastGameModalRef = useRef<OpenModalId | ModalType>(ModalId.Menu);

  const openModal = useCallback(
    (targetModal: OpenModalId | ModalType) => {
      if (isGameModal(targetModal)) {
        lastGameModalRef.current = targetModal;
      }

      const shouldPause = doesModalPauseGame(targetModal);
      const currentlyPausedByModal = doesModalPauseGame(modalManager.activeModal);

      if (shouldPause) {
        setPaused(true);
      } else if (currentlyPausedByModal) {
        setPaused(false);
      }
      modalManager.openModal(targetModal);
    },
    [modalManager, setPaused]
  );

  const openLastGameModal = useCallback(() => {
    openModal(lastGameModalRef.current);
  }, [openModal]);

  const closeModal = useCallback(() => {
    const wasPausedModal = doesModalPauseGame(modalManager.activeModal);
    modalManager.closeModal();
    if (wasPausedModal) {
      setPaused(false);
    }
  }, [modalManager, setPaused]);

  const toggleModal = useCallback(
    (targetModal: OpenModalId | ModalType) => {
      if (modalManager.activeModal === targetModal) {
        closeModal();
      } else {
        openModal(targetModal);
      }
    },
    [modalManager.activeModal, closeModal, openModal]
  );

  const resumeGame = useCallback(() => {
    modalManager.closeModal();
    setPaused(false);
  }, [modalManager, setPaused]);

  const togglePause = useCallback(() => {
    if (modalManager.isAnyModalOpen) {
      resumeGame();
    } else {
      engineTogglePause();
    }
  }, [modalManager.isAnyModalOpen, resumeGame, engineTogglePause]);

  return useMemo(
    () => ({
      modalManager,
      openModal,
      openLastGameModal,
      toggleModal,
      closeModal,
      resumeGame,
      togglePause,
    }),
    [
      modalManager,
      openModal,
      openLastGameModal,
      toggleModal,
      closeModal,
      resumeGame,
      togglePause,
    ]
  );
}
