import React from "react";
import { Sparkles, Sword, Shirt, Shield, Sparkle, CircleDot } from "lucide-react";
import { EquipmentState, Item } from "@game/types";
import { ItemSlot } from "@components/ui";
import { useI18n } from "@context/I18nContext";

export interface InventoryPaperdollProps {
  equipment: EquipmentState;
  selectedSlot: keyof EquipmentState | null;
  onSelectSlot: (slot: keyof EquipmentState, item: Item | null) => void;
}

export const InventoryPaperdoll: React.FC<InventoryPaperdollProps> = ({
  equipment,
  selectedSlot,
  onSelectSlot,
}) => {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto my-2">
      {/* Row 1: Helmet */}
      <div className="col-start-2">
        <ItemSlot
          item={equipment.helmet}
          label={t("helmet")}
          iconPlaceholder={<Sparkles size={11} />}
          isSelected={selectedSlot === "helmet"}
          onClick={() => onSelectSlot("helmet", equipment.helmet)}
        />
      </div>

      {/* Row 2: MainHand, Armor, OffHand */}
      <ItemSlot
        item={equipment.mainHand}
        label={t("mainHand")}
        iconPlaceholder={<Sword size={11} />}
        isSelected={selectedSlot === "mainHand"}
        onClick={() => onSelectSlot("mainHand", equipment.mainHand)}
      />

      <ItemSlot
        item={equipment.armor}
        label={t("armor")}
        iconPlaceholder={<Shirt size={11} />}
        isSelected={selectedSlot === "armor"}
        onClick={() => onSelectSlot("armor", equipment.armor)}
      />

      <ItemSlot
        item={equipment.offHand}
        label={t("offHand")}
        iconPlaceholder={<Shield size={11} />}
        isSelected={selectedSlot === "offHand"}
        onClick={() => onSelectSlot("offHand", equipment.offHand)}
      />

      {/* Row 3: Amulet, Ring */}
      <div className="col-start-1">
        <ItemSlot
          item={equipment.amulet}
          label={t("amulet")}
          iconPlaceholder={<Sparkle size={11} />}
          isSelected={selectedSlot === "amulet"}
          onClick={() => onSelectSlot("amulet", equipment.amulet)}
        />
      </div>

      <div className="col-start-3">
        <ItemSlot
          item={equipment.ring}
          label={t("ring")}
          iconPlaceholder={<CircleDot size={11} />}
          isSelected={selectedSlot === "ring"}
          onClick={() => onSelectSlot("ring", equipment.ring)}
        />
      </div>
    </div>
  );
};

export default InventoryPaperdoll;
