import React from "react";
import { Item } from "@game/types";
import { Button } from "@components/ui";
import { ItemSlot } from "./ItemSlot";
import { useI18n } from "@context/I18nContext";

export interface InventoryQuickBeltProps {
  quickPotions: (Item | null)[];
  selectedPotionIdx: number | null;
  onSelectPotion: (idx: number, potion: Item | null) => void;
  onDrinkPotion: (idx: number) => void;
}

export const InventoryQuickBelt: React.FC<InventoryQuickBeltProps> = ({
  quickPotions,
  selectedPotionIdx,
  onSelectPotion,
  onDrinkPotion,
}) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((idx) => {
        const pot = quickPotions[idx];
        const isSelected = selectedPotionIdx === idx;
        return (
          <div key={idx} className="flex flex-col gap-1.5">
            <ItemSlot
              item={pot}
              label={`Slot ${idx + 1}`}
              isSelected={isSelected}
              count={pot ? pot.count : undefined}
              onClick={() => onSelectPotion(idx, pot)}
            />
            {pot && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onDrinkPotion(idx)}
              >
                {t("useItem")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InventoryQuickBelt;
