import { useState, useCallback } from "react";
import { EquipmentSlotKey } from "@components/adapters/inventoryAdapter";

export type InventorySelection =
  | { readonly kind: "none" }
  | { readonly kind: "backpack"; readonly index: number }
  | { readonly kind: "equipment"; readonly slot: EquipmentSlotKey }
  | { readonly kind: "potion"; readonly index: number };

export interface InventorySelectionState {
  readonly selection: InventorySelection;
  readonly selectedBackpackIdx: number | null;
  readonly selectedEquipSlot: EquipmentSlotKey | null;
  readonly selectedPotionIdx: number | null;
  readonly selectPlayer: (idx: number, setActivePlayerIndex?: (idx: number) => void) => void;
  readonly selectEquipSlot: (slot: EquipmentSlotKey) => void;
  readonly selectBackpackSlot: (idx: number) => void;
  readonly selectPotionSlot: (idx: number) => void;
  readonly handleEquip: (backpackIdx: number, equipItem: (idx: number) => boolean) => boolean;
  readonly handleUnequip: (slot: EquipmentSlotKey, unequipItem: (slot: EquipmentSlotKey) => boolean) => boolean;
  readonly handleUsePotion: (idx: number, usePotion: (idx: number) => boolean) => boolean;
  readonly handleDiscard: (backpackIdx: number, discardItem: (idx: number) => boolean) => boolean;
  readonly clearSelection: () => void;
}

/**
 * Manages UI selection coordinates and actions across inventory slots.
 */
export function useInventorySelection(
  initialSelection: InventorySelection = { kind: "none" }
): InventorySelectionState {
  const [selection, setSelection] = useState<InventorySelection>(initialSelection);

  const clearSelection = useCallback(() => {
    setSelection({ kind: "none" });
  }, []);

  const selectPlayer = useCallback(
    (idx: number, setActivePlayerIndex?: (idx: number) => void) => {
      setActivePlayerIndex?.(idx);
      clearSelection();
    },
    [clearSelection]
  );

  const selectEquipSlot = useCallback((slot: EquipmentSlotKey) => {
    setSelection({
      kind: "equipment",
      slot,
    });
  }, []);

  const selectBackpackSlot = useCallback((idx: number) => {
    setSelection({
      kind: "backpack",
      index: idx,
    });
  }, []);

  const selectPotionSlot = useCallback((idx: number) => {
    setSelection({
      kind: "potion",
      index: idx,
    });
  }, []);

  const handleEquip = useCallback(
    (backpackIdx: number, equipItem: (idx: number) => boolean): boolean => {
      const success = equipItem(backpackIdx);
      if (success) {
        clearSelection();
      }
      return success;
    },
    [clearSelection]
  );

  const handleUnequip = useCallback(
    (slot: EquipmentSlotKey, unequipItem: (slot: EquipmentSlotKey) => boolean): boolean => {
      const success = unequipItem(slot);
      if (success) {
        clearSelection();
      }
      return success;
    },
    [clearSelection]
  );

  const handleUsePotion = useCallback(
    (idx: number, usePotion: (idx: number) => boolean): boolean => {
      const success = usePotion(idx);
      if (success) {
        clearSelection();
      }
      return success;
    },
    [clearSelection]
  );

  const handleDiscard = useCallback(
    (backpackIdx: number, discardItem: (idx: number) => boolean): boolean => {
      const success = discardItem(backpackIdx);
      if (success) {
        clearSelection();
      }
      return success;
    },
    [clearSelection]
  );

  const selectedBackpackIdx = selection.kind === "backpack" ? selection.index : null;
  const selectedEquipSlot = selection.kind === "equipment" ? selection.slot : null;
  const selectedPotionIdx = selection.kind === "potion" ? selection.index : null;

  return {
    selection,
    selectedBackpackIdx,
    selectedEquipSlot,
    selectedPotionIdx,
    selectPlayer,
    selectEquipSlot,
    selectBackpackSlot,
    selectPotionSlot,
    handleEquip,
    handleUnequip,
    handleUsePotion,
    handleDiscard,
    clearSelection,
  };
}
