import React, { useMemo } from "react";
import { Backpack, BookOpen } from "lucide-react";
import { Text, KeyboundButton } from "@ui";
import { useI18n } from "@context/I18nContext";
import { resolvePotionSlotsVM } from "./hud.mapper";
import { HUDPanel } from "./components/common/HUDPanel";
import { HUDSpellSlot } from "./components/belt/HUDSpellSlot";
import { HUDPotionSlotButton } from "./components/belt/HUDPotionSlotButton";
import type { HUDQuickBeltProps, PotionSlotVM } from "./types";
import { cn } from "@lib/utils";

export const HUDQuickBelt: React.FC<HUDQuickBeltProps> = React.memo(({
  belt,
  player,
  playerNumber,
  primarySpell,
  secondarySpell,
  primarySpellName,
  secondarySpellName,
  primaryKeyLabel,
  secondaryKeyLabel,
  potionKeyRangeLabel,
  onUsePotion,
  onOpenInventory,
  onOpenSkillTree,
  showRpgButtons = false,
}) => {
  const { t } = useI18n();

  const effectivePlayerNumber = belt ? belt.playerNumber : (playerNumber ?? 1);
  const isP1 = effectivePlayerNumber === 1;

  const effectivePrimarySpell = belt ? belt.primarySpell : primarySpell;
  const effectiveSecondarySpell = belt ? belt.secondarySpell : secondarySpell;
  const effectivePrimarySpellName = belt ? belt.primarySpellName : (primarySpellName ?? "");
  const effectiveSecondarySpellName = belt ? belt.secondarySpellName : (secondarySpellName ?? "");
  const effectivePrimaryKeyLabel = belt ? belt.primaryKeyLabel : (primaryKeyLabel ?? "");
  const effectiveSecondaryKeyLabel = belt ? belt.secondaryKeyLabel : (secondaryKeyLabel ?? "");
  const effectivePotionKeyRangeLabel = belt ? belt.potionKeyRangeLabel : (potionKeyRangeLabel ?? "");

  const potionSlots: readonly PotionSlotVM[] = useMemo(() => {
    if (belt?.potions) return belt.potions;
    return resolvePotionSlotsVM(player?.inventory?.quickPotions, isP1);
  }, [belt?.potions, player?.inventory?.quickPotions, isP1]);

  const borderColor = isP1 ? "border-red-950/70" : "border-cyan-950/70";
  const titleColor = isP1 ? "text-stone-400" : "text-cyan-400";
  const potionBorderColor = isP1
    ? "border-amber-600/70 hover:border-amber-400"
    : "border-cyan-600/70 hover:border-cyan-400";
  const potionTextColor = isP1 ? "text-amber-200" : "text-cyan-200";

  return (
    <HUDPanel
      padding="md"
      borderColor={borderColor}
      className="flex flex-col gap-3 max-w-[200px]"
    >
      <div className="flex flex-col gap-1.5">
        <Text as="span" size="2xs" weight="bold" uppercase className={cn("tracking-wider", titleColor)}>
          {isP1 ? t("tabSkills") : `P2 ${t("tabSkills")}`}
        </Text>

        {effectivePrimarySpell && (
          <HUDSpellSlot
            spell={effectivePrimarySpell}
            spellName={effectivePrimarySpellName}
            keyLabel={effectivePrimaryKeyLabel}
            variant="cyan"
          />
        )}

        {effectiveSecondarySpell && (
          <HUDSpellSlot
            spell={effectiveSecondarySpell}
            spellName={effectiveSecondarySpellName}
            keyLabel={effectiveSecondaryKeyLabel}
            variant="purple"
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-stone-800/80 pt-2">
        <div className="flex items-center justify-between">
          <Text weight="bold" size="2xs" uppercase className="tracking-wider text-amber-400">
            {t("quickPotions")}
          </Text>
          <Text size="3xs" variant="subtle">{effectivePotionKeyRangeLabel}</Text>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {potionSlots.map((pot) => (
            <HUDPotionSlotButton
              key={`pot-${effectivePlayerNumber}-${pot.slotIndex}`}
              slot={pot}
              playerNumber={effectivePlayerNumber}
              onUsePotion={onUsePotion}
              borderColor={potionBorderColor}
              textColor={potionTextColor}
            />
          ))}
        </div>
      </div>

      {showRpgButtons && onOpenInventory && onOpenSkillTree && (
        <div className="grid grid-cols-2 gap-1.5 border-t border-stone-800/80 pt-2">
          <KeyboundButton
            id="flank-inventory-btn"
            variant="secondary"
            size="sm"
            title={`${t("inventoryBtn")} [I]`}
            onClick={onOpenInventory}
            leftIcon={<Backpack size={13} />}
            kbdKey="I"
            kbdVariant="amber"
            className="h-7 py-1 px-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border-amber-700/60 text-amber-300"
          />

          <KeyboundButton
            id="flank-skilltree-btn"
            variant="secondary"
            size="sm"
            title={`${t("skillTreeBtn")} [K]`}
            onClick={onOpenSkillTree}
            leftIcon={<BookOpen size={13} />}
            kbdKey="K"
            kbdVariant="purple"
            className="h-7 py-1 px-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border-purple-700/60 text-purple-300"
          />
        </div>
      )}
    </HUDPanel>
  );
});

HUDQuickBelt.displayName = "HUDQuickBelt";
export default HUDQuickBelt;
