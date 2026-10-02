import React from "react";
import { ItemSlot } from "./ItemSlot";
import { BackpackGridVM, resolveBackpackVM } from "@components/adapters/inventoryAdapter";

export interface InventoryBackpackGridProps {
  readonly grid?: BackpackGridVM;
  readonly backpack?: readonly any[] | any[];
  readonly selectedBackpackIdx: number | null;
  readonly onSelectSlot: (idx: number, item: any | null) => void;
  readonly maxSlots?: number;
}

/**
 * Presentational grid displaying the player's 16-slot traveling backpack.
 */
export const InventoryBackpackGrid = React.memo(function InventoryBackpackGrid({
  grid,
  backpack,
  selectedBackpackIdx,
  onSelectSlot,
  maxSlots = 16,
}: InventoryBackpackGridProps) {
  const effectiveSlots = grid ? grid.slots : resolveBackpackVM(backpack, maxSlots).slots;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {effectiveSlots.map((slotVM) => {
        const isSelected = selectedBackpackIdx === slotVM.slotIndex;
        return (
          <ItemSlot
            key={`backpack-${slotVM.slotIndex}`}
            slot={slotVM}
            isSelected={isSelected}
            onClick={() => onSelectSlot(slotVM.slotIndex, slotVM)}
          />
        );
      })}
    </div>
  );
});

InventoryBackpackGrid.displayName = "InventoryBackpackGrid";

export default InventoryBackpackGrid;
