import React from "react";
import { Button } from "@components/ui";
import { ItemSlot } from "./ItemSlot";
import { useI18n } from "@context/I18nContext";
import {
  InventoryQuickBeltVM,
  resolveInventoryQuickBeltVM,
} from "@components/adapters/inventoryAdapter";

export interface InventoryQuickBeltProps {
  readonly belt?: InventoryQuickBeltVM;
  readonly quickPotions?: readonly any[] | any[];
  readonly selectedPotionIdx: number | null;
  readonly onSelectPotion: (idx: number, potion: any | null) => void;
  readonly onDrinkPotion?: (idx: number) => void;
}

/**
 * Presentational bar representing the 3 quick potion belt slots.
 */
export const InventoryQuickBelt = React.memo(function InventoryQuickBelt({
  belt,
  quickPotions,
  selectedPotionIdx,
  onSelectPotion,
  onDrinkPotion,
}: InventoryQuickBeltProps) {
  const { t } = useI18n();

  const effectiveBelt = belt ?? resolveInventoryQuickBeltVM(quickPotions);

  return (
    <div className="grid grid-cols-3 gap-2">
      {effectiveBelt.slots.map((slotVM) => {
        const isSelected = selectedPotionIdx === slotVM.slotIndex;
        return (
          <div key={`quick-belt-${slotVM.slotIndex}`} className="flex flex-col gap-1.5">
            <ItemSlot
              slot={slotVM}
              label={slotVM.keyLabel ? `${t("quickPotions")} ${slotVM.keyLabel}` : undefined}
              isSelected={isSelected}
              onClick={() => onSelectPotion(slotVM.slotIndex, slotVM)}
            />
            {onDrinkPotion && !slotVM.isEmpty && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onDrinkPotion(slotVM.slotIndex)}
              >
                {t("useItem")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
});

InventoryQuickBelt.displayName = "InventoryQuickBelt";

export default InventoryQuickBelt;
