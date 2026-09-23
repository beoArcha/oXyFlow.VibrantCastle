import { useState, useCallback } from "react";
import { PlayerId, KeyAction } from "../game/types";

export type ActiveModal = "none" | "menu" | "help" | "inventory" | "skillTree" | "creation" | "rebindKey";

export interface RebindTarget {
  player: PlayerId;
  action: KeyAction;
}

export function useModalManager() {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [rebindTarget, setRebindTarget] = useState<RebindTarget | null>(null);

  const openMenu = useCallback(() => setActiveModal("menu"), []);
  const openHelp = useCallback(() => setActiveModal("help"), []);
  const openInventory = useCallback(() => setActiveModal("inventory"), []);
  const openSkillTree = useCallback(() => setActiveModal("skillTree"), []);
  const openCreation = useCallback(() => setActiveModal("creation"), []);
  const openRebind = useCallback((player: PlayerId, action: KeyAction) => {
    setRebindTarget({ player, action });
    setActiveModal("rebindKey");
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal("none");
    setRebindTarget(null);
  }, []);

  return {
    activeModal,
    isMenuOpen: activeModal === "menu",
    isHelpOpen: activeModal === "help",
    isInventoryOpen: activeModal === "inventory",
    isSkillTreeOpen: activeModal === "skillTree",
    isCreationOpen: activeModal === "creation",
    isRebindOpen: activeModal === "rebindKey",
    rebindTarget,
    openMenu,
    openHelp,
    openInventory,
    openSkillTree,
    openCreation,
    openRebind,
    closeModal,
  };
}
