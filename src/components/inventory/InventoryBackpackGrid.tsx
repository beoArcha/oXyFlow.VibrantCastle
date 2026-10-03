import React from "react";
import { ItemSlot } from "@components/ui";
import { BackpackGridVM } from "@components/adapters/inventoryAdapter";

export interface InventoryBackpackGridProps {
  readonly grid: BackpackGridVM;
  readonly selectedBackpackIdx: number | null;
  readonly onSelectSlot: (idx: number) => void;
}

/**
 * Presentational grid displaying the player's traveling backpack slots.
 */
export const InventoryBackpackGrid = React.memo(function InventoryBackpackGrid({
  grid,
  selectedBackpackIdx,
  onSelectSlot,
}: InventoryBackpackGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {grid.slots.map((slotVM) => {
        const isSelected = selectedBackpackIdx === slotVM.slotIndex;
        return (
          <ItemSlot
            key={`backpack-${slotVM.slotIndex}`}
            slot={slotVM}
            isSelected={isSelected}
            onClick={() => onSelectSlot(slotVM.slotIndex)}
          />
        );
      })}
    </div>
  );
});

InventoryBackpackGrid.displayName = "InventoryBackpackGrid";

export default InventoryBackpackGrid;
