import React from "react";
import { ItemSlot } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { InventoryQuickBeltVM } from "./inventory.mapper";

export interface InventoryQuickBeltProps {
  readonly belt: InventoryQuickBeltVM;
  readonly selectedPotionIdx: number | null;
  readonly onSelectPotion: (idx: number) => void;
  readonly registerSlotRef?: (key: string, el: HTMLDivElement | null) => void;
  readonly onSlotKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => void;
  readonly onSlotFocus?: (idx: number) => void;
  readonly onSlotPointerDown?: () => void;
}

/**
 * Presentational bar representing the 3 quick potion belt slots (1-3).
 */
export const InventoryQuickBelt = React.memo(function InventoryQuickBelt({
  belt,
  selectedPotionIdx,
  onSelectPotion,
  registerSlotRef,
  onSlotKeyDown,
  onSlotFocus,
  onSlotPointerDown,
}: InventoryQuickBeltProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2">
      {belt.slots.map((slotVM) => {
        const isSelected = selectedPotionIdx === slotVM.slotIndex;
        const slotName = t("quickBeltSlotLabel", { slot: slotVM.slotIndex + 1 });
        return (
          <ItemSlot
            key={`quick-belt-${slotVM.slotIndex}`}
            ref={(el) => registerSlotRef?.(`potion:${slotVM.slotIndex}`, el)}
            data-inv-slot={`potion:${slotVM.slotIndex}`}
            size="sm"
            slot={slotVM}
            label={slotVM.isEmpty ? slotName : `[${slotVM.keyLabel}] ${t(slotVM.nameKey ?? "")}`}
            accessibleLabel={
              slotVM.isEmpty ? slotName : `${slotName}: ${t(slotVM.nameKey ?? "")}`
            }
            isSelected={isSelected}
            onPointerDown={onSlotPointerDown}
            onFocus={() => onSlotFocus?.(slotVM.slotIndex)}
            onClick={() => onSelectPotion(slotVM.slotIndex)}
            onKeyDown={(e) => onSlotKeyDown?.(e, slotVM.slotIndex)}
            className={
              (slotVM.isEmpty
                ? "border-dashed border-stone-700/80 bg-surface-darkest/40 "
                : "") +
              "p-1 text-center [&>span:first-child]:text-[9px] [&>span:first-child]:mb-0.5 [&>div]:w-8 [&>div]:h-8"
            }
          />
        );
      })}
    </div>
  );
});

InventoryQuickBelt.displayName = "InventoryQuickBelt";

export default InventoryQuickBelt;
