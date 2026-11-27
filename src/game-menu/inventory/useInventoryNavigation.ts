import { useEffect, useCallback, useRef } from "react";
import type React from "react";
import { MENU_CONTEXT_ACTION_EVENT } from "@game-menu/controls/useMenuGamepad";
import type { InventoryState, Item } from "@game/types";
import { getSelectionKey } from "./inventoryGridNav";
import type { EquipmentSlotKey, GridDirection, InventorySelection } from "./types";

const ARROW_TO_DIR: Record<string, GridDirection> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

export interface UseInventoryNavigationOptions {
  readonly selection: InventorySelection;
  readonly selectedBackpackIdx: number | null;
  readonly selectedItem: Item | null;
  readonly activeInventory: InventoryState | null;
  readonly isBackpackEmpty: boolean;
  readonly isConfirmOpen: boolean;
  readonly moveSelection: (dir: GridDirection, hasBackpackSlots: boolean) => InventorySelection;
  readonly toggleDetails: () => void;
  readonly onEquip: (idx: number) => void;
  readonly onUnequip: (slot: EquipmentSlotKey) => void;
  readonly onUsePotion: (idx: number) => void;
  readonly onRequestDiscard: (idx: number) => void;
}

/**
 * Coordinates keyboard arrow navigation, Enter/A primary actions, X discard, Y details toggle,
 * and gamepad menu context events inside the inventory panel.
 */
export function useInventoryNavigation({
  selection,
  selectedBackpackIdx,
  selectedItem,
  activeInventory,
  isBackpackEmpty,
  isConfirmOpen,
  moveSelection,
  toggleDetails,
  onEquip,
  onUnequip,
  onUsePotion,
  onRequestDiscard,
}: UseInventoryNavigationOptions) {
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pointerDownRef = useRef(false);

  const registerSlotRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) slotRefs.current.set(key, el);
    else slotRefs.current.delete(key);
  }, []);

  const focusSelectionSlot = useCallback((next: InventorySelection) => {
    slotRefs.current.get(getSelectionKey(next))?.focus();
  }, []);

  const executePrimary = useCallback(
    (target: InventorySelection) => {
      if (target.kind === "backpack") onEquip(target.index);
      else if (target.kind === "equipment") onUnequip(target.slot);
      else if (target.kind === "potion") onUsePotion(target.index);
    },
    [onEquip, onUnequip, onUsePotion]
  );

  const handleSlotPointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleSlotClick = useCallback(
    (target: InventorySelection, selectFn: () => void) => {
      const fromPointer = pointerDownRef.current;
      pointerDownRef.current = false;
      const key = getSelectionKey(target);
      const isAlreadySelected = getSelectionKey(selection) === key;
      const isFocused = typeof document !== "undefined" && document.activeElement === slotRefs.current.get(key);
      if (!fromPointer && isAlreadySelected && isFocused) {
        executePrimary(target);
        return;
      }
      selectFn();
    },
    [selection, executePrimary]
  );

  const handleSlotFocus = useCallback(
    (target: InventorySelection, selectFn: () => void) => {
      if (pointerDownRef.current) return;
      if (getSelectionKey(selection) !== getSelectionKey(target)) selectFn();
    },
    [selection]
  );

  const handleSlotKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, target: InventorySelection) => {
      if (isConfirmOpen) return;
      const dir = ARROW_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        e.stopPropagation();
        focusSelectionSlot(moveSelection(dir, !isBackpackEmpty));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        executePrimary(target);
        return;
      }
      const lower = e.key.toLowerCase();
      if (lower === "x" && target.kind === "backpack" && activeInventory?.backpack[target.index]) {
        e.preventDefault();
        onRequestDiscard(target.index);
        return;
      }
      if (lower === "y" && selectedItem) {
        e.preventDefault();
        toggleDetails();
      }
    },
    [isConfirmOpen, moveSelection, isBackpackEmpty, focusSelectionSlot, executePrimary, activeInventory, onRequestDiscard, selectedItem, toggleDetails]
  );

  useEffect(() => {
    const onContextAction = (e: Event) => {
      if (isConfirmOpen || selectedBackpackIdx === null) return;
      if (!activeInventory?.backpack[selectedBackpackIdx]) return;
      e.preventDefault();
      onRequestDiscard(selectedBackpackIdx);
    };
    const onPanelKeyDown = (e: KeyboardEvent) => {
      if (isConfirmOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.dataset?.invSlot) return;
      if (target?.closest('[role="tablist"]') && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
      const dir = ARROW_TO_DIR[e.key];
      if (dir && target?.closest("#inventory-container")) {
        e.preventDefault();
        focusSelectionSlot(moveSelection(dir, !isBackpackEmpty));
        return;
      }
      const lower = e.key.toLowerCase();
      if (lower === "x" && selectedBackpackIdx !== null && activeInventory?.backpack[selectedBackpackIdx] && target?.closest("#inventory-container")) {
        e.preventDefault();
        onRequestDiscard(selectedBackpackIdx);
        return;
      }
      if (lower === "y" && selectedItem && target?.closest("#inventory-container")) {
        e.preventDefault();
        toggleDetails();
      }
    };
    document.addEventListener(MENU_CONTEXT_ACTION_EVENT, onContextAction);
    document.addEventListener("keydown", onPanelKeyDown);
    return () => {
      document.removeEventListener(MENU_CONTEXT_ACTION_EVENT, onContextAction);
      document.removeEventListener("keydown", onPanelKeyDown);
    };
  }, [isConfirmOpen, selectedBackpackIdx, activeInventory, onRequestDiscard, moveSelection, isBackpackEmpty, focusSelectionSlot, selectedItem, toggleDetails]);

  return {
    registerSlotRef,
    handleSlotPointerDown,
    handleSlotClick,
    handleSlotFocus,
    handleSlotKeyDown,
  };
}
