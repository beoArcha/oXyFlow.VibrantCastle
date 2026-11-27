import React from "react";
import { CheckCircle, ArrowDownToDot, Trash2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Button, Badge, ItemIcon, Heading, Paragraph, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import type {
  ItemDetailsVM,
  ItemComparisonVM,
  EquipmentSlotKey,
} from "./inventory.mapper";

export interface InventoryItemDetailsProps {
  readonly details: ItemDetailsVM;
  readonly comparison?: ItemComparisonVM | null;
  readonly showDetails?: boolean;
  readonly onToggleDetails?: () => void;
  readonly selectedBackpackIdx: number | null;
  readonly selectedEquipSlot: EquipmentSlotKey | null;
  readonly selectedPotionIdx: number | null;
  readonly onEquip: (backpackIdx: number) => void;
  readonly onUnequip: (slot: EquipmentSlotKey) => void;
  readonly onUsePotion: (potionIdx: number) => void;
  readonly onDiscard?: (backpackIdx: number) => void;
}

/**
 * Inspector card showing actions, stat comparison deltas vs currently equipped gear,
 * and collapsible item modifiers + lore description.
 */
export const InventoryItemDetails = React.memo(function InventoryItemDetails({
  details,
  comparison = null,
  showDetails = true,
  onToggleDetails,
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
    <Card variant="highlight" className="p-3 animate-in fade-in duration-150" data-testid="inventory-inspector">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 rounded-xl border border-amber-500/50 flex items-center justify-center shrink-0">
            <ItemIcon name={details.iconName} size={24} className="text-amber-300 drop-shadow" />
          </div>
          <div>
            <Heading level={4} size="base" variant="secondary" className="leading-snug">
              {localizedName}
            </Heading>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="stone">{t(details.typeLabelKey)}</Badge>
              <Badge variant={details.rarityVariant}>{t(details.rarityLabelKey)}</Badge>
              {details.count !== undefined && details.count > 1 && (
                <Badge variant="amber">x{details.count}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {selectedBackpackIdx !== null && (
            <Button
              variant="primary"
              size="sm"
              className="whitespace-nowrap px-2.5"
              icon={details.isPotion ? <Heart size={13} /> : <CheckCircle size={13} />}
              onClick={() => onEquip(selectedBackpackIdx)}
            >
              {details.isPotion ? t("equipToBelt") : t("equipItem")}
            </Button>
          )}

          {selectedEquipSlot && (
            <Button
              variant="danger"
              size="sm"
              className="whitespace-nowrap px-2.5"
              icon={<ArrowDownToDot size={13} />}
              onClick={() => onUnequip(selectedEquipSlot)}
            >
              {t("unequipItem")}
            </Button>
          )}

          {selectedPotionIdx !== null && (
            <Button
              variant="primary"
              size="sm"
              className="whitespace-nowrap px-2.5"
              icon={<Heart size={13} />}
              onClick={() => onUsePotion(selectedPotionIdx)}
            >
              {t("useItem")}
            </Button>
          )}

          {selectedBackpackIdx !== null && onDiscard && (
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap px-2.5"
              icon={<Trash2 size={13} />}
              aria-label={t("discardItem")}
              onClick={() => onDiscard(selectedBackpackIdx)}
            >
              {t("discardItem")}
            </Button>
          )}

          {onToggleDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap px-2"
              aria-expanded={showDetails}
              icon={showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              onClick={onToggleDetails}
            >
              {t("toggleDetails")}
            </Button>
          )}
        </div>
      </div>

      {comparison && (
        <div
          data-testid="inventory-stat-comparison"
          className="mt-2.5 pt-2 border-t border-amber-900/40 flex flex-col gap-1.5"
        >
          <Text size="2xs" variant="muted" weight="semibold">
            {comparison.equippedItemNameKey
              ? `${t("compareWithEquipped")} ${t(comparison.equippedItemNameKey)}`
              : t("compareEmptySlot")}
          </Text>
          {comparison.deltas.length > 0 ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {comparison.deltas.map((delta) => (
                <Text
                  key={delta.type}
                  family="mono"
                  size="xs"
                  weight="bold"
                  data-stat-delta={delta.type}
                  className={cn("flex items-center gap-1 tabular-nums", delta.textColorClass)}
                >
                  <ItemIcon name={delta.iconName} size={12} />
                  <span>{delta.formattedDelta}</span>
                  <span>{t(delta.labelKey)}</span>
                </Text>
              ))}
            </div>
          ) : (
            <Text size="2xs" variant="muted">
              {t("compareNoStatChange")}
            </Text>
          )}
        </div>
      )}

      {showDetails && (details.modifiers.length > 0 || localizedDesc) && (
        <div data-testid="inventory-inspector-details" className="mt-2 pt-2 border-t border-amber-900/30">
          {details.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {details.modifiers.map((modifier) => (
                <Text
                  key={modifier.type}
                  family="mono"
                  weight="semibold"
                  size="xs"
                  className={cn("flex items-center gap-1", modifier.textColorClass)}
                >
                  <ItemIcon name={modifier.iconName} size={12} /> {modifier.formattedValue} {t(modifier.labelKey)}
                </Text>
              ))}
            </div>
          )}

          {localizedDesc && (
            <Paragraph size="xs" variant="default" italic className="leading-relaxed mt-1.5">
              {localizedDesc}
            </Paragraph>
          )}
        </div>
      )}
    </Card>
  );
});

InventoryItemDetails.displayName = "InventoryItemDetails";

export default InventoryItemDetails;
