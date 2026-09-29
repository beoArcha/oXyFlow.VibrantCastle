import { useState, useCallback } from "react";

export type ActiveModal = "none" | "menu" | "help" | "inventory" | "skillTree" | "creation";

export interface UseModalManagerResult {
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

/**
 * Custom React hook for managing the single active modal overlay in the application UI.
 * Guarantees mutual exclusion (only one modal active at a time) and clean dismissal.
 */
export function useModalManager(): UseModalManagerResult {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");

  const openMenu = useCallback(() => setActiveModal("menu"), []);
  const openHelp = useCallback(() => setActiveModal("help"), []);
  const openInventory = useCallback(() => setActiveModal("inventory"), []);
  const openSkillTree = useCallback(() => setActiveModal("skillTree"), []);
  const openCreation = useCallback(() => setActiveModal("creation"), []);

  const closeModal = useCallback(() => {
    setActiveModal("none");
  }, []);

  return {
    activeModal,
    isMenuOpen: activeModal === "menu",
    isHelpOpen: activeModal === "help",
    isInventoryOpen: activeModal === "inventory",
    isSkillTreeOpen: activeModal === "skillTree",
    isCreationOpen: activeModal === "creation",
    openMenu,
    openHelp,
    openInventory,
    openSkillTree,
    openCreation,
    closeModal,
  };
}
