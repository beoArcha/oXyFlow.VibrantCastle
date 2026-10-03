import React from "react";
import { Crown, Sword, Shirt, Shield, Sparkles, CircleDot } from "lucide-react";
import { ItemSlot } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import {
  EquipmentPaperdollVM,
  EquipmentSlotKey,
} from "@components/adapters/inventoryAdapter";

export interface InventoryPaperdollProps {
  readonly paperdoll: EquipmentPaperdollVM;
  readonly selectedSlot: EquipmentSlotKey | null;
  readonly onSelectSlot: (slot: EquipmentSlotKey) => void;
}

const slotGridClasses: Record<EquipmentSlotKey, string> = {
  helmet: "col-start-2",
  mainHand: "col-start-1",
  armor: "col-start-2",
  offHand: "col-start-3",
  amulet: "col-start-1",
  ring: "col-start-3",
};

const placeholderIcons: Record<EquipmentSlotKey, React.ReactNode> = {
  helmet: <Crown size={11} />,
  mainHand: <Sword size={11} />,
  armor: <Shirt size={11} />,
  offHand: <Shield size={11} />,
  amulet: <Sparkles size={11} />,
  ring: <CircleDot size={11} />,
};

/**
 * Presentational Gothic Paperdoll grid representing 6 character equipment slots.
 */
export const InventoryPaperdoll = React.memo(function InventoryPaperdoll({
  paperdoll,
  selectedSlot,
  onSelectSlot,
}: InventoryPaperdollProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto my-2">
      {paperdoll.slots.map((slotVM) => {
        const isSelected = selectedSlot === slotVM.slotKey;
        return (
          <div key={slotVM.slotKey} className={slotGridClasses[slotVM.slotKey]}>
            <ItemSlot
              slot={slotVM}
              label={t(slotVM.labelKey)}
              iconPlaceholder={placeholderIcons[slotVM.slotKey]}
              isSelected={isSelected}
              onClick={() => onSelectSlot(slotVM.slotKey)}
            />
          </div>
        );
      })}
    </div>
  );
});

InventoryPaperdoll.displayName = "InventoryPaperdoll";

export default InventoryPaperdoll;
