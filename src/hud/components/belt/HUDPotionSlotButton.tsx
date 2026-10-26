import React from "react";
import { FlaskConical } from "lucide-react";
import { Button, Text, Code } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import type { PotionSlotVM } from "../../types";

export interface HUDPotionSlotButtonProps {
  readonly slot: PotionSlotVM;
  readonly playerNumber?: 1 | 2;
  readonly onUsePotion: (slotIndex: number) => void;
  readonly borderColor?: string;
  readonly textColor?: string;
  readonly className?: string;
}

/**
 * Renders an interactive quick potion slot button with flask icon, stack counter, and shortcut key.
 */
export const HUDPotionSlotButton: React.FC<HUDPotionSlotButtonProps> = React.memo(({
  slot,
  playerNumber = 1,
  onUsePotion,
  borderColor,
  textColor,
  className,
}) => {
  const { t } = useI18n();
  const hasPotion = !slot.isEmpty && slot.count > 0;
  const potionTitle = hasPotion && slot.nameKey
    ? `${t(slot.nameKey)} (${t("usePotion")})`
    : t("potionEmpty");

  const defaultBorderColor = playerNumber === 1
    ? "border-amber-600/70 hover:border-amber-400"
    : "border-cyan-600/70 hover:border-cyan-400";
  const defaultTextColor = playerNumber === 1 ? "text-amber-200" : "text-cyan-200";

  const resolvedBorder = borderColor ?? defaultBorderColor;
  const resolvedText = textColor ?? defaultTextColor;

  const iconColor = hasPotion
    ? slot.healHp
      ? "text-red-400"
      : slot.healMana
        ? "text-cyan-400"
        : "text-amber-400"
    : "text-stone-600";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={potionTitle}
      aria-label={potionTitle}
      onClick={() => onUsePotion(slot.slotIndex)}
      className={cn(
        "relative aspect-square h-auto p-1 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer shadow-none",
        hasPotion
          ? `bg-stone-900/80 ${resolvedBorder} hover:scale-105`
          : "bg-black/30 border-stone-800 text-stone-700 opacity-60",
        className
      )}
    >
      <FlaskConical size={14} className={iconColor} />
      {hasPotion && (
        <Text weight="bold" size="3xs" className={cn("mt-0.5", resolvedText)}>
          x{slot.count}
        </Text>
      )}
      <Code size="micro" className="absolute -bottom-1 -right-1 bg-black/80 px-1 rounded text-stone-400">
        {slot.keyLabel}
      </Code>
    </Button>
  );
});

HUDPotionSlotButton.displayName = "HUDPotionSlotButton";
export default HUDPotionSlotButton;
