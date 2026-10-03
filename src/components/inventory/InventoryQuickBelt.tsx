import React from "react";
import { Button, ItemSlot } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { InventoryQuickBeltVM } from "@components/adapters/inventoryAdapter";

export interface InventoryQuickBeltProps {
  readonly belt: InventoryQuickBeltVM;
  readonly selectedPotionIdx: number | null;
  readonly onSelectPotion: (idx: number) => void;
  readonly onUsePotion?: (idx: number) => void;
}

/**
 * Presentational bar representing the 3 quick potion belt slots.
 */
export const InventoryQuickBelt = React.memo(function InventoryQuickBelt({
  belt,
  selectedPotionIdx,
  onSelectPotion,
  onUsePotion,
}: InventoryQuickBeltProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2">
      {belt.slots.map((slotVM) => {
        const isSelected = selectedPotionIdx === slotVM.slotIndex;
        return (
          <div key={`quick-belt-${slotVM.slotIndex}`} className="flex flex-col gap-1.5">
            <ItemSlot
              slot={slotVM}
              label={slotVM.keyLabel ? `${t("quickPotions")} ${slotVM.keyLabel}` : undefined}
              isSelected={isSelected}
              onClick={() => onSelectPotion(slotVM.slotIndex)}
            />
            {onUsePotion && !slotVM.isEmpty && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onUsePotion(slotVM.slotIndex)}
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
