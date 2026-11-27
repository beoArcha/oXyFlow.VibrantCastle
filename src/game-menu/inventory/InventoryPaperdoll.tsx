import React from "react";
import { Crown, Sword, Shirt, Shield, Sparkles, CircleDot } from "lucide-react";
import { ItemSlot } from "@ui";
import { useI18n } from "@context/I18nContext";
import { CharacterPortrait } from "../character";
import type { EquipmentPaperdollVM, EquipmentSlotKey } from "./inventory.mapper";

export interface InventoryPaperdollProps {
  readonly paperdoll: EquipmentPaperdollVM;
  readonly characterId: string;
  readonly selectedSlot: EquipmentSlotKey | null;
  readonly onSelectSlot: (slot: EquipmentSlotKey) => void;
  readonly registerSlotRef?: (key: string, el: HTMLDivElement | null) => void;
  readonly onSlotKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>, slot: EquipmentSlotKey) => void;
  readonly onSlotFocus?: (slot: EquipmentSlotKey) => void;
  readonly onSlotPointerDown?: () => void;
}

const slotGridClasses: Record<EquipmentSlotKey, string> = {
  amulet: "col-start-1 row-start-1",
  helmet: "col-start-2 row-start-1",
  ring: "col-start-3 row-start-1",
  mainHand: "col-start-1 row-start-2",
  offHand: "col-start-3 row-start-2",
  armor: "col-start-2 row-start-3",
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
 * 3x3 Gothic paperdoll grid positioning 6 equipment slots around the hero portrait.
 */
export const InventoryPaperdoll = React.memo(function InventoryPaperdoll({
  paperdoll,
  characterId,
  selectedSlot,
  onSelectSlot,
  registerSlotRef,
  onSlotKeyDown,
  onSlotFocus,
  onSlotPointerDown,
}: InventoryPaperdollProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-3 gap-1.5 w-full max-w-[368px] mx-auto items-center">
      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-600/40 bg-stone-950/80 shadow-inner flex items-center justify-center">
          <CharacterPortrait characterId={characterId} className="w-full h-full object-cover" />
        </div>
      </div>

      {paperdoll.slots.map((slotVM) => {
        const isSelected = selectedSlot === slotVM.slotKey;
        const slotLabel = t(slotVM.labelKey);
        return (
          <div key={slotVM.slotKey} className={`min-w-0 ${slotGridClasses[slotVM.slotKey]}`}>
            <ItemSlot
              ref={(el) => registerSlotRef?.(`equipment:${slotVM.slotKey}`, el)}
              data-inv-slot={`equipment:${slotVM.slotKey}`}
              size="sm"
              slot={slotVM}
              label={slotLabel}
              accessibleLabel={
                slotVM.isEmpty ? slotLabel : `${slotLabel}: ${t(slotVM.nameKey ?? "")}`
              }
              iconPlaceholder={placeholderIcons[slotVM.slotKey]}
              isSelected={isSelected}
              onPointerDown={onSlotPointerDown}
              onFocus={() => onSlotFocus?.(slotVM.slotKey)}
              onClick={() => onSelectSlot(slotVM.slotKey)}
              onKeyDown={(e) => onSlotKeyDown?.(e, slotVM.slotKey)}
              className={
                (slotVM.isEmpty
                  ? "border-dashed border-stone-700/80 bg-surface-darkest/40 "
                  : "") +
                "w-full p-1 text-center [&>span:first-child]:max-w-full [&>span:first-child]:flex-wrap [&>span:first-child]:justify-center [&>span:first-child]:text-center [&>span:first-child]:text-[9px] [&>span:first-child]:leading-tight [&>span:first-child]:break-words [&>div]:w-8 [&>div]:h-8"
              }
            />
          </div>
        );
      })}
    </div>
  );
});

InventoryPaperdoll.displayName = "InventoryPaperdoll";

export default InventoryPaperdoll;
