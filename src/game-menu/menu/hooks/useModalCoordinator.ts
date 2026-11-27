import { useCallback, useMemo, useRef, useState } from "react";
import {
  ModalId,
  doesModalPauseGame,
  getNavigationModalDefinitions,
  isGameModal,
  type ModalType,
  type OpenModalId,
} from "@game-menu/modal/modalRegistry";
import { SETTINGS_TAB_REGISTRY, SettingsTabId } from "@game-menu/menu/menuTabRegistry";
import { useModalManager, type ModalManager } from "./useModalManager";

export type SubTabMap = Partial<Record<OpenModalId, string>>;

export interface UseModalCoordinatorOptions {
  readonly setPaused: (paused: boolean) => void;
  readonly togglePause: () => void;
}

export interface ModalCoordinator {
  readonly modalManager: ModalManager;
  readonly activeSubTabs: SubTabMap;
  readonly getActiveSubTab: (modal: OpenModalId | ModalType) => string | undefined;
  readonly setActiveSubTab: (modal: OpenModalId | ModalType, subTab: string) => void;
  readonly openModal: (modal: OpenModalId | ModalType, subTab?: string) => void;
  readonly openLastGameModal: () => void;
  readonly toggleModal: (modal: OpenModalId | ModalType) => void;
  readonly closeModal: () => void;
  readonly resumeGame: () => void;
  readonly togglePause: () => void;
  readonly stepGameTab: (delta: -1 | 1) => void;
  readonly stepSubTab: (delta: -1 | 1) => void;
}

/**
 * Single-responsibility coordinator synchronizing modal transitions with engine pause state
 * strictly via MODAL_REGISTRY metadata (OCP — zero hardcoded modal conditionals).
 * Tracks the last-used player-facing L1 tab and per-L1 activeSubTab in session memory.
 */
export function useModalCoordinator({
  setPaused,
  togglePause: engineTogglePause,
}: UseModalCoordinatorOptions): ModalCoordinator {
  const modalManager = useModalManager(ModalId.None);
  const lastGameModalRef = useRef<OpenModalId | ModalType>(ModalId.Menu);
  const [activeSubTabs, setActiveSubTabs] = useState<SubTabMap>({
    [ModalId.Settings]: SettingsTabId.Display,
  });

  const getActiveSubTab = useCallback(
    (modal: OpenModalId | ModalType): string | undefined => activeSubTabs[modal as OpenModalId],
    [activeSubTabs]
  );

  const setActiveSubTab = useCallback(
    (modal: OpenModalId | ModalType, subTab: string) => {
      setActiveSubTabs((prev) => ({
        ...prev,
        [modal as OpenModalId]: subTab,
      }));
    },
    []
  );

  const openModal = useCallback(
    (targetModal: OpenModalId | ModalType, subTab?: string) => {
      if (isGameModal(targetModal)) {
        lastGameModalRef.current = targetModal;
      }
      if (subTab !== undefined) {
        setActiveSubTabs((prev) => ({
          ...prev,
          [targetModal as OpenModalId]: subTab,
        }));
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

  const stepGameTab = useCallback(
    (delta: -1 | 1) => {
      if (!isGameModal(modalManager.activeModal)) return;
      const gameDefs = getNavigationModalDefinitions().filter((d) => d.dialog === "game");
      if (gameDefs.length === 0) return;

      const currentIdx = gameDefs.findIndex((d) => d.id === modalManager.activeModal);
      const baseIdx = currentIdx === -1 ? 0 : currentIdx;
      const nextIdx = (baseIdx + delta + gameDefs.length) % gameDefs.length;
      openModal(gameDefs[nextIdx].id);
    },
    [modalManager.activeModal, openModal]
  );

  const stepSubTab = useCallback(
    (delta: -1 | 1) => {
      if (modalManager.activeModal !== ModalId.Settings) return;
      if (SETTINGS_TAB_REGISTRY.length === 0) return;

      const currentSub = activeSubTabs[ModalId.Settings] ?? SettingsTabId.Display;
      const currentIdx = SETTINGS_TAB_REGISTRY.findIndex((s) => s.id === currentSub);
      const baseIdx = currentIdx === -1 ? 0 : currentIdx;
      const nextIdx = (baseIdx + delta + SETTINGS_TAB_REGISTRY.length) % SETTINGS_TAB_REGISTRY.length;
      setActiveSubTab(ModalId.Settings, SETTINGS_TAB_REGISTRY[nextIdx].id);
    },
    [modalManager.activeModal, activeSubTabs, setActiveSubTab]
  );

  return useMemo(
    () => ({
      modalManager,
      activeSubTabs,
      getActiveSubTab,
      setActiveSubTab,
      openModal,
      openLastGameModal,
      toggleModal,
      closeModal,
      resumeGame,
      togglePause,
      stepGameTab,
      stepSubTab,
    }),
    [
      modalManager,
      activeSubTabs,
      getActiveSubTab,
      setActiveSubTab,
      openModal,
      openLastGameModal,
      toggleModal,
      closeModal,
      resumeGame,
      togglePause,
      stepGameTab,
      stepSubTab,
    ]
  );
}
