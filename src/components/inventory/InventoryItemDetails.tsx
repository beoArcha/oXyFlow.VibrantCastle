import React from "react";
import { CheckCircle, ArrowDownToDot, Trash2, Zap, Heart, Shield, Sword } from "lucide-react";
import { Item, EquipmentState, ItemType } from "../../game/types";
import { Card, Button, Badge } from "../ui";
import { ItemIcon } from "./ItemIcon";
import { useI18n } from "../../hooks/useI18n";

export interface InventoryItemDetailsProps {
  item: Item;
  selectedBackpackIdx: number | null;
  selectedEquipSlot: keyof EquipmentState | null;
  selectedPotionIdx: number | null;
  onEquip: (backpackIdx: number) => void;
  onUnequip: (slot: keyof EquipmentState) => void;
  onUsePotion: (potionIdx: number) => void;
  onDiscard?: (backpackIdx: number) => void;
}

export const InventoryItemDetails: React.FC<InventoryItemDetailsProps> = ({
  item,
  selectedBackpackIdx,
  selectedEquipSlot,
  selectedPotionIdx,
  onEquip,
  onUnequip,
  onUsePotion,
  onDiscard,
}) => {
  const { t } = useI18n();

  const localizedName = t(item.nameKey) || item.id;
  const localizedDesc = t(item.descriptionKey) || "";

  const getItemTypeLabel = (type: ItemType): string => {
    switch (type) {
      case ItemType.Weapon:
        return t("itemTypeWeapon");
      case ItemType.Shield:
        return t("itemTypeShield");
      case ItemType.Helmet:
        return t("itemTypeHelmet");
      case ItemType.Armor:
        return t("itemTypeArmor");
      case ItemType.Amulet:
        return t("itemTypeAmulet");
      case ItemType.Ring:
        return t("itemTypeRing");
      case ItemType.Potion:
        return t("itemTypePotion");
      default:
        return type;
    }
  };

  const getRarityLabel = (rarity: string): string => {
    switch (rarity) {
      case "common":
        return t("rarityCommon");
      case "uncommon":
        return t("rarityUncommon");
      case "rare":
        return t("rarityRare");
      case "legendary":
        return t("rarityLegendary");
      default:
        return rarity;
    }
  };

  const rarityBadgeVariant: Record<string, "stone" | "amber" | "cyan" | "red"> = {
    common: "stone",
    uncommon: "amber",
    rare: "cyan",
    legendary: "amber",
  };

  return (
    <Card variant="highlight" className="animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        {/* Item Icon & Basic Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-900 rounded-xl border border-amber-500/50 flex items-center justify-center shrink-0">
            <ItemIcon name={item.icon} size={28} className="text-amber-300 drop-shadow" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-200 leading-snug">
              {localizedName}
            </h4>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="stone">{getItemTypeLabel(item.type)}</Badge>
              <Badge variant={rarityBadgeVariant[item.rarity] || "stone"}>
                {getRarityLabel(item.rarity)}
              </Badge>
              {item.count !== undefined && item.count > 1 && (
                <Badge variant="amber">x{item.count}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedBackpackIdx !== null && item.type !== ItemType.Potion && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle size={14} />}
              onClick={() => onEquip(selectedBackpackIdx)}
            >
              {t("equipItem")}
            </Button>
          )}

          {selectedBackpackIdx !== null && item.type === ItemType.Potion && (
            <Button
              variant="primary"
              size="sm"
              icon={<Heart size={14} />}
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

      {/* Item Stat Modifiers */}
      <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-amber-900/40 text-xs">
        {item.attackBonus !== undefined && item.attackBonus > 0 && (
          <span className="flex items-center gap-1 text-amber-300 font-mono font-semibold">
            <Sword size={12} /> +{item.attackBonus} {t("itemAttackBonus")}
          </span>
        )}
        {item.defenseBonus !== undefined && item.defenseBonus > 0 && (
          <span className="flex items-center gap-1 text-red-300 font-mono font-semibold">
            <Shield size={12} /> +{item.defenseBonus} {t("itemDefenseBonus")}
          </span>
        )}
        {item.maxHpBonus !== undefined && item.maxHpBonus > 0 && (
          <span className="flex items-center gap-1 text-rose-300 font-mono font-semibold">
            <Heart size={12} /> +{item.maxHpBonus} {t("itemHpBonus")}
          </span>
        )}
        {item.maxManaBonus !== undefined && item.maxManaBonus > 0 && (
          <span className="flex items-center gap-1 text-cyan-300 font-mono font-semibold">
            <Zap size={12} /> +{item.maxManaBonus} {t("itemManaBonus")}
          </span>
        )}
        {item.maxStaminaBonus !== undefined && item.maxStaminaBonus > 0 && (
          <span className="flex items-center gap-1 text-amber-200 font-mono font-semibold">
            <Zap size={12} /> +{item.maxStaminaBonus} {t("itemStaminaBonus")}
          </span>
        )}
        {item.healHp !== undefined && item.healHp > 0 && (
          <span className="flex items-center gap-1 text-rose-300 font-mono font-semibold">
            <Heart size={12} /> +{item.healHp} {t("itemHealHp")}
          </span>
        )}
        {item.healMana !== undefined && item.healMana > 0 && (
          <span className="flex items-center gap-1 text-cyan-300 font-mono font-semibold">
            <Zap size={12} /> +{item.healMana} {t("itemHealMana")}
          </span>
        )}
        {item.healStamina !== undefined && item.healStamina > 0 && (
          <span className="flex items-center gap-1 text-amber-200 font-mono font-semibold">
            <Zap size={12} /> +{item.healStamina} {t("itemHealStamina")}
          </span>
        )}
      </div>

      {/* Description Text */}
      {localizedDesc && (
        <p className="text-xs text-stone-300 leading-relaxed mt-2 border-t border-amber-900/30 pt-2 italic">
          {localizedDesc}
        </p>
      )}
    </Card>
  );
};

export default InventoryItemDetails;
