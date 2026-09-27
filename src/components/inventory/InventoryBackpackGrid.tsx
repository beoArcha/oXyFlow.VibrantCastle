import React from "react";
import { Item } from "@game/types";
import { ItemSlot } from "@components/ui";

export interface InventoryBackpackGridProps {
  backpack: (Item | null)[];
  selectedBackpackIdx: number | null;
  onSelectSlot: (idx: number, item: Item | null) => void;
  maxSlots?: number;
}

export const InventoryBackpackGrid: React.FC<InventoryBackpackGridProps> = ({
  backpack,
  selectedBackpackIdx,
  onSelectSlot,
  maxSlots = 16,
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const item = backpack[idx] || null;
        const isSelected = selectedBackpackIdx === idx;
        return (
          <ItemSlot
            key={`backpack-${idx}`}
            item={item}
            isSelected={isSelected}
            count={item ? item.count : undefined}
            onClick={() => onSelectSlot(idx, item)}
          />
        );
      })}
    </div>
  );
};

export default InventoryBackpackGrid;
