import { useState, useCallback, useMemo } from "react";
import { Item, EquipmentState, InventoryState } from "@game/types";
import { EquipmentSlotKey } from "@components/adapters/inventoryAdapter";

export type InventorySelection =
  | { readonly kind: "none" }
  | { readonly kind: "backpack"; readonly index: number; readonly item: Item | null }
  | { readonly kind: "equipment"; readonly slot: EquipmentSlotKey; readonly item: Item | null }
  | { readonly kind: "potion"; readonly index: number; readonly item: Item | null };

export interface InventorySelectionState {
  readonly selection: InventorySelection;
  readonly selectedItem: Item | null;
  readonly selectedBackpackIdx: number | null;
  readonly selectedEquipSlot: EquipmentSlotKey | null;
  readonly selectedPotionIdx: number | null;
  readonly selectPlayer: (idx: number, setActivePlayerIndex?: (idx: number) => void) => void;
  readonly selectEquipSlot: (slot: EquipmentSlotKey, item: Item | null) => void;
  readonly selectBackpackSlot: (idx: number, item: Item | null) => void;
  readonly selectPotionSlot: (idx: number, item: Item | null) => void;
  readonly handleEquip: (backpackIdx: number, equipItem: (idx: number) => boolean) => boolean;
  readonly handleUnequip: (slot: EquipmentSlotKey, unequipItem: (slot: EquipmentSlotKey) => boolean) => boolean;
  readonly handleUsePotion: (
    idx: number,
    usePotion: (idx: number) => boolean,
    activeInventory?: InventoryState | null
  ) => boolean;
  readonly handleDiscard: (backpackIdx: number, discardItem: (idx: number) => boolean) => boolean;
  readonly clearSelection: () => void;
}

/**
 * Hook orchestrating mutually exclusive item selection and contextual item actions
 * across backpack slots, paperdoll equipment slots, and quick potion belt slots.
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

  const selectEquipSlot = useCallback((slot: EquipmentSlotKey, item: Item | null) => {
    setSelection({
      kind: "equipment",
      slot,
      item,
    });
  }, []);

  const selectBackpackSlot = useCallback((idx: number, item: Item | null) => {
    setSelection({
      kind: "backpack",
      index: idx,
      item,
    });
  }, []);

  const selectPotionSlot = useCallback((idx: number, item: Item | null) => {
    setSelection({
      kind: "potion",
      index: idx,
      item,
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
    (
      idx: number,
      usePotion: (idx: number) => boolean,
      _activeInventory?: InventoryState | null
    ): boolean => {
      const success = usePotion(idx);
      if (success) {
        setSelection((current) => {
          if (current.kind === "potion" && current.index === idx && current.item) {
            const currentCount = current.item.count ?? 1;
            if (currentCount <= 1) {
              return { kind: "none" };
            }
            return {
              kind: "potion",
              index: idx,
              item: {
                ...current.item,
                count: currentCount - 1,
              },
            };
          }
          return { kind: "none" };
        });
      }
      return success;
    },
    []
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

  const selectedItem = useMemo(() => {
    return selection.kind !== "none" ? selection.item : null;
  }, [selection]);

  const selectedBackpackIdx = useMemo(() => {
    return selection.kind === "backpack" ? selection.index : null;
  }, [selection]);

  const selectedEquipSlot = useMemo(() => {
    return selection.kind === "equipment" ? selection.slot : null;
  }, [selection]);

  const selectedPotionIdx = useMemo(() => {
    return selection.kind === "potion" ? selection.index : null;
  }, [selection]);

  return {
    selection,
    selectedItem,
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
