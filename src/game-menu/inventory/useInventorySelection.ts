import { useState, useCallback } from "react";
import type { EquipmentSlotKey, GridDirection, InventorySelection } from "./types";
import { moveInventorySelection } from "./inventoryGridNav";

export type { InventorySelection };

export interface InventorySelectionState {
  readonly selection: InventorySelection;
  readonly selectedBackpackIdx: number | null;
  readonly selectedEquipSlot: EquipmentSlotKey | null;
  readonly selectedPotionIdx: number | null;
  readonly showDetails: boolean;
  readonly toggleDetails: () => void;
  readonly selectPlayer: (idx: number, setActivePlayerIndex?: (idx: number) => void) => void;
  readonly selectEquipSlot: (slot: EquipmentSlotKey) => void;
  readonly selectBackpackSlot: (idx: number) => void;
  readonly selectPotionSlot: (idx: number) => void;
  readonly moveSelection: (direction: GridDirection, hasBackpackSlots?: boolean) => InventorySelection;
  readonly handleEquip: (backpackIdx: number, equipItem: (idx: number) => boolean) => boolean;
  readonly handleUnequip: (slot: EquipmentSlotKey, unequipItem: (slot: EquipmentSlotKey) => boolean) => boolean;
  readonly handleUsePotion: (idx: number, usePotion: (idx: number) => boolean) => boolean;
  readonly handleDiscard: (backpackIdx: number, discardItem: (idx: number) => boolean) => boolean;
  readonly clearSelection: () => void;
}

/**
 * Manages UI selection coordinates, inspector detail toggle, and slot actions.
 */
export function useInventorySelection(
  initialSelection: InventorySelection = { kind: "none" }
): InventorySelectionState {
  const [selection, setSelection] = useState<InventorySelection>(initialSelection);
  const [showDetails, setShowDetails] = useState(true);

  const clearSelection = useCallback(() => {
    setSelection({ kind: "none" });
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  const selectPlayer = useCallback(
    (idx: number, setActivePlayerIndex?: (idx: number) => void) => {
      setActivePlayerIndex?.(idx);
      clearSelection();
    },
    [clearSelection]
  );

  const selectEquipSlot = useCallback((slot: EquipmentSlotKey) => {
    setSelection({ kind: "equipment", slot });
  }, []);

  const selectBackpackSlot = useCallback((idx: number) => {
    setSelection({ kind: "backpack", index: idx });
  }, []);

  const selectPotionSlot = useCallback((idx: number) => {
    setSelection({ kind: "potion", index: idx });
  }, []);

  const moveSelection = useCallback(
    (direction: GridDirection, hasBackpackSlots: boolean = true): InventorySelection => {
      const next = moveInventorySelection(selection, direction, hasBackpackSlots);
      setSelection(next);
      return next;
    },
    [selection]
  );

  const handleEquip = useCallback(
    (backpackIdx: number, equipItem: (idx: number) => boolean): boolean => {
      const success = equipItem(backpackIdx);
      if (success) clearSelection();
      return success;
    },
    [clearSelection]
  );

  const handleUnequip = useCallback(
    (slot: EquipmentSlotKey, unequipItem: (slot: EquipmentSlotKey) => boolean): boolean => {
      const success = unequipItem(slot);
      if (success) clearSelection();
      return success;
    },
    [clearSelection]
  );

  const handleUsePotion = useCallback(
    (idx: number, usePotion: (idx: number) => boolean): boolean => {
      const success = usePotion(idx);
      if (success) clearSelection();
      return success;
    },
    [clearSelection]
  );

  const handleDiscard = useCallback(
    (backpackIdx: number, discardItem: (idx: number) => boolean): boolean => {
      const success = discardItem(backpackIdx);
      if (success) clearSelection();
      return success;
    },
    [clearSelection]
  );

  return {
    selection,
    selectedBackpackIdx: selection.kind === "backpack" ? selection.index : null,
    selectedEquipSlot: selection.kind === "equipment" ? selection.slot : null,
    selectedPotionIdx: selection.kind === "potion" ? selection.index : null,
    showDetails,
    toggleDetails,
    selectPlayer,
    selectEquipSlot,
    selectBackpackSlot,
    selectPotionSlot,
    moveSelection,
    handleEquip,
    handleUnequip,
    handleUsePotion,
    handleDiscard,
    clearSelection,
  };
}
