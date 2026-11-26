import { useState, useCallback, useMemo } from "react";
import { ModalId, type ModalType } from "@game-menu/modal/modalRegistry";

export type ActiveModalState = ModalType | ModalId;

export interface ModalManager {
  readonly activeModal: ActiveModalState;
  readonly isAnyModalOpen: boolean;
  readonly isMenuOpen: boolean;
  readonly isHelpOpen: boolean;
  readonly isInventoryOpen: boolean;
  readonly isSkillTreeOpen: boolean;
  readonly isCreationOpen: boolean;
  readonly openMenu: () => void;
  readonly openHelp: () => void;
  readonly openInventory: () => void;
  readonly openSkillTree: () => void;
  readonly openCreation: () => void;
  readonly openModal: (modal: ModalType | ModalId) => void;
  readonly closeModal: () => void;
  readonly toggleModal: (modal: ModalType | ModalId) => void;
}

/**
 * Manages active overlay modal state driven by typed ModalId enum values.
 */
export function useModalManager(initial: ActiveModalState = ModalId.None): ModalManager {
  const [activeModal, setActiveModal] = useState<ActiveModalState>(initial);

  const openModal = useCallback((modal: ModalType | ModalId) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(ModalId.None);
  }, []);

  const toggleModal = useCallback((modal: ModalType | ModalId) => {
    setActiveModal((prev) => (prev === modal ? ModalId.None : modal));
  }, []);

  const openMenu = useCallback(() => setActiveModal(ModalId.Menu), []);
  const openHelp = useCallback(() => setActiveModal(ModalId.Help), []);
  const openInventory = useCallback(() => setActiveModal(ModalId.Inventory), []);
  const openSkillTree = useCallback(() => setActiveModal(ModalId.SkillTree), []);
  const openCreation = useCallback(() => setActiveModal(ModalId.Creation), []);

  return useMemo(
    () => ({
      activeModal,
      isAnyModalOpen: activeModal !== ModalId.None,
      isMenuOpen: activeModal === ModalId.Menu,
      isHelpOpen: activeModal === ModalId.Help,
      isInventoryOpen: activeModal === ModalId.Inventory,
      isSkillTreeOpen: activeModal === ModalId.SkillTree,
      isCreationOpen: activeModal === ModalId.Creation,
      openMenu,
      openHelp,
      openInventory,
      openSkillTree,
      openCreation,
      openModal,
      closeModal,
      toggleModal,
    }),
    [
      activeModal,
      openMenu,
      openHelp,
      openInventory,
      openSkillTree,
      openCreation,
      openModal,
      closeModal,
      toggleModal,
    ]
  );
}
