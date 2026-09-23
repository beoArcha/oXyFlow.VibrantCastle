import { useState } from "react";
import { Item, EquipmentState, InventoryState } from "../../game/types";

export interface InventorySelectionState {
  selectedItem: Item | null;
  selectedBackpackIdx: number | null;
  selectedEquipSlot: keyof EquipmentState | null;
  selectedPotionIdx: number | null;
  selectPlayer: (idx: number, setActivePlayerIndex: (idx: number) => void) => void;
  selectEquipSlot: (slot: keyof EquipmentState, item: Item | null) => void;
  selectBackpackSlot: (idx: number, item: Item | null) => void;
  selectPotionSlot: (idx: number, item: Item | null) => void;
  handleEquip: (backpackIdx: number, equipItem: (idx: number) => boolean) => void;
  handleUnequip: (slot: keyof EquipmentState, unequipItem: (slot: keyof EquipmentState) => boolean) => void;
  handleUsePotion: (
    idx: number,
    usePotion: (idx: number) => boolean,
    activeInventory: InventoryState
  ) => void;
  handleDiscard: (backpackIdx: number, discardItem: (idx: number) => boolean) => void;
  clearSelection: () => void;
}

export function useInventorySelection(): InventorySelectionState {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedBackpackIdx, setSelectedBackpackIdx] = useState<number | null>(null);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<keyof EquipmentState | null>(null);
  const [selectedPotionIdx, setSelectedPotionIdx] = useState<number | null>(null);

  const clearSelection = () => {
    setSelectedItem(null);
    setSelectedBackpackIdx(null);
    setSelectedEquipSlot(null);
    setSelectedPotionIdx(null);
  };

  const selectPlayer = (idx: number, setActivePlayerIndex: (idx: number) => void) => {
    setActivePlayerIndex(idx);
    clearSelection();
  };

  const selectEquipSlot = (slot: keyof EquipmentState, item: Item | null) => {
    setSelectedEquipSlot(slot);
    setSelectedItem(item);
    setSelectedBackpackIdx(null);
    setSelectedPotionIdx(null);
  };

  const selectBackpackSlot = (idx: number, item: Item | null) => {
    setSelectedBackpackIdx(idx);
    setSelectedItem(item);
    setSelectedEquipSlot(null);
    setSelectedPotionIdx(null);
  };

  const selectPotionSlot = (idx: number, item: Item | null) => {
    setSelectedPotionIdx(idx);
    setSelectedItem(item);
    setSelectedEquipSlot(null);
    setSelectedBackpackIdx(null);
  };

  const handleEquip = (backpackIdx: number, equipItem: (idx: number) => boolean) => {
    const success = equipItem(backpackIdx);
    if (success) {
      clearSelection();
    }
  };

  const handleUnequip = (
    slot: keyof EquipmentState,
    unequipItem: (slot: keyof EquipmentState) => boolean
  ) => {
    const success = unequipItem(slot);
    if (success) {
      clearSelection();
    }
  };

  const handleUsePotion = (
    idx: number,
    usePotion: (idx: number) => boolean,
    activeInventory: InventoryState
  ) => {
    const success = usePotion(idx);
    if (success) {
      const updatedPot = activeInventory.quickPotions[idx];
      if (!updatedPot || (updatedPot.count !== undefined && updatedPot.count <= 0)) {
        clearSelection();
      } else {
        setSelectedItem({ ...updatedPot });
      }
    }
  };

  const handleDiscard = (backpackIdx: number, discardItem: (idx: number) => boolean) => {
    const success = discardItem(backpackIdx);
    if (success) {
      clearSelection();
    }
  };

  return {
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
