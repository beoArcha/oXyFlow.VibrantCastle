import React from "react";
import { ItemSlot, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { BackpackGridVM } from "./inventory.mapper";

export interface InventoryBackpackGridProps {
  readonly grid: BackpackGridVM;
  readonly selectedBackpackIdx: number | null;
  readonly onSelectSlot: (idx: number) => void;
  readonly registerSlotRef?: (key: string, el: HTMLDivElement | null) => void;
  readonly onSlotKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => void;
  readonly onSlotFocus?: (idx: number) => void;
  readonly onSlotPointerDown?: () => void;
}

/**
 * Presentational grid displaying the player's 16-slot traveling backpack or empty-state sentence.
 */
export const InventoryBackpackGrid = React.memo(function InventoryBackpackGrid({
  grid,
  selectedBackpackIdx,
  onSelectSlot,
  registerSlotRef,
  onSlotKeyDown,
  onSlotFocus,
  onSlotPointerDown,
}: InventoryBackpackGridProps) {
  const { t } = useI18n();

  if (grid.isEmpty) {
    return (
      <Paragraph size="xs" variant="muted" className="py-5 text-center">
        {t("backpackEmptyState")}
      </Paragraph>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
      {grid.slots.map((slotVM) => {
        const isSelected = selectedBackpackIdx === slotVM.slotIndex;
        const slotLabel = t("backpackSlotLabel", { slot: slotVM.slotIndex + 1 });
        return (
          <ItemSlot
            key={`backpack-${slotVM.slotIndex}`}
            ref={(el) => registerSlotRef?.(`backpack:${slotVM.slotIndex}`, el)}
            data-inv-slot={`backpack:${slotVM.slotIndex}`}
            size="sm"
            slot={slotVM}
            label={slotVM.isEmpty ? slotLabel : undefined}
            accessibleLabel={
              slotVM.isEmpty ? slotLabel : t(slotVM.nameKey ?? "backpack")
            }
            isSelected={isSelected}
            onPointerDown={onSlotPointerDown}
            onFocus={() => onSlotFocus?.(slotVM.slotIndex)}
            onClick={() => onSelectSlot(slotVM.slotIndex)}
            onKeyDown={(e) => onSlotKeyDown?.(e, slotVM.slotIndex)}
            className={
              (slotVM.isEmpty
                ? "border-dashed border-stone-700/80 bg-surface-darkest/40 text-center "
                : "") +
              "p-1 [&>span:first-child]:text-[9px] [&>span:first-child]:mb-0.5 [&>div]:w-8 [&>div]:h-8"
            }
          />
        );
      })}
    </div>
  );
});

InventoryBackpackGrid.displayName = "InventoryBackpackGrid";

export default InventoryBackpackGrid;
