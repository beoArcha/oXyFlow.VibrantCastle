import React from "react";
import { CheckCircle, ArrowDownToDot, Trash2, Heart } from "lucide-react";
import { Card, Button, Badge, ItemIcon } from "@ui";
import { useI18n } from "@context/I18nContext";
import {
  ItemDetailsVM,
  EquipmentSlotKey,
} from "./inventory.mapper";
import { cn } from "@lib/utils";

export interface InventoryItemDetailsProps {
  readonly details: ItemDetailsVM;
  readonly selectedBackpackIdx: number | null;
  readonly selectedEquipSlot: EquipmentSlotKey | null;
  readonly selectedPotionIdx: number | null;
  readonly onEquip: (backpackIdx: number) => void;
  readonly onUnequip: (slot: EquipmentSlotKey) => void;
  readonly onUsePotion: (potionIdx: number) => void;
  readonly onDiscard?: (backpackIdx: number) => void;
}

/**
 * Presentational inspector displaying detailed statistics, description, and actions
 * for the currently selected equipment, backpack, or potion item.
 */
export const InventoryItemDetails = React.memo(function InventoryItemDetails({
  details,
  selectedBackpackIdx,
  selectedEquipSlot,
  selectedPotionIdx,
  onEquip,
  onUnequip,
  onUsePotion,
  onDiscard,
}: InventoryItemDetailsProps) {
  const { t } = useI18n();

  const localizedName = t(details.nameKey) || details.id;
  const localizedDesc = t(details.descriptionKey) || "";

  return (
    <Card variant="highlight" className="animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-900 rounded-xl border border-amber-500/50 flex items-center justify-center shrink-0">
            <ItemIcon name={details.iconName} size={28} className="text-amber-300 drop-shadow" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-200 leading-snug">
              {localizedName}
            </h4>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="stone">{t(details.typeLabelKey)}</Badge>
              <Badge variant={details.rarityVariant}>
                {t(details.rarityLabelKey)}
              </Badge>
              {details.count !== undefined && details.count > 1 && (
                <Badge variant="amber">x{details.count}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedBackpackIdx !== null && (
            <Button
              variant="primary"
              size="sm"
              icon={details.isPotion ? <Heart size={14} /> : <CheckCircle size={14} />}
              onClick={() => onEquip(selectedBackpackIdx)}
            >
              {details.isPotion ? t("useItem") : t("equipItem")}
            </Button>
          )}

          {selectedEquipSlot && (
            <Button
              variant="danger"
              size="sm"
              icon={<ArrowDownToDot size={14} />}
              onClick={() => onUnequip(selectedEquipSlot)}
            >
              {t("unequipItem")}
            </Button>
          )}

          {selectedPotionIdx !== null && (
            <Button
              variant="primary"
              size="sm"
              icon={<Heart size={14} />}
              onClick={() => onUsePotion(selectedPotionIdx)}
            >
              {t("useItem")}
            </Button>
          )}

          {selectedBackpackIdx !== null && onDiscard && (
            <Button
              variant="outline"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => onDiscard(selectedBackpackIdx)}
            >
              {t("discardItem")}
            </Button>
          )}
        </div>
      </div>

      {details.modifiers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-amber-900/40 text-xs">
          {details.modifiers.map((modifier) => (
            <span
              key={modifier.type}
              className={cn("flex items-center gap-1 font-mono font-semibold", modifier.textColorClass)}
            >
              <ItemIcon name={modifier.iconName} size={12} /> {modifier.formattedValue} {t(modifier.labelKey)}
            </span>
          ))}
        </div>
      )}

      {localizedDesc && (
        <p className="text-xs text-stone-300 leading-relaxed mt-2 border-t border-amber-900/30 pt-2 italic">
          {localizedDesc}
        </p>
      )}
    </Card>
  );
});

InventoryItemDetails.displayName = "InventoryItemDetails";

export default InventoryItemDetails;
