import React from "react";
import { CheckCircle, ArrowDownToDot, Trash2, Heart } from "lucide-react";
import { Card, Button, Badge, ItemIcon } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import {
  ItemDetailsVM,
  EquipmentSlotKey,
  resolveItemDetailsVM,
} from "@components/adapters/inventoryAdapter";
import { cn } from "@lib/utils";

export interface InventoryItemDetailsProps {
  readonly item?: any;
  readonly details?: ItemDetailsVM | null;
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
  item,
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

  const effectiveDetails = details ?? resolveItemDetailsVM(item);

  if (!effectiveDetails) return null;

  const localizedName = t(effectiveDetails.nameKey) || effectiveDetails.id;
  const localizedDesc = t(effectiveDetails.descriptionKey) || "";

  return (
    <Card variant="highlight" className="animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-900 rounded-xl border border-amber-500/50 flex items-center justify-center shrink-0">
            <ItemIcon name={effectiveDetails.iconName} size={28} className="text-amber-300 drop-shadow" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-200 leading-snug">
              {localizedName}
            </h4>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="stone">{t(effectiveDetails.typeLabelKey)}</Badge>
              <Badge variant={effectiveDetails.rarityVariant}>
                {t(effectiveDetails.rarityLabelKey)}
              </Badge>
              {effectiveDetails.count !== undefined && effectiveDetails.count > 1 && (
                <Badge variant="amber">x{effectiveDetails.count}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedBackpackIdx !== null && (
            <Button
              variant="primary"
              size="sm"
              icon={effectiveDetails.isPotion ? <Heart size={14} /> : <CheckCircle size={14} />}
              onClick={() => onEquip(selectedBackpackIdx)}
            >
              {t("equipItem")}
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

      {effectiveDetails.modifiers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-amber-900/40 text-xs">
          {effectiveDetails.modifiers.map((modifier) => (
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
