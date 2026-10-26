import React, { useMemo } from "react";
import { Sparkles, Shield, FlaskConical, Backpack, BookOpen } from "lucide-react";
import { Button, KbdKey, Text, Code } from "@ui";
import { useI18n } from "@context/I18nContext";
import { resolvePotionSlotsVM } from "./hud.mapper";
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
    <div
      className={cn(
        "bg-stone-950/85 backdrop-blur-md p-2.5 rounded-2xl border shadow-2xl flex flex-col gap-3 max-w-[200px]",
        borderColor
      )}
    >
      <div className="flex flex-col gap-1.5">
        <Text as="span" size="2xs" weight="bold" uppercase className={cn("tracking-wider", titleColor)}>
          {isP1 ? t("tabSkills") : `P2 ${t("tabSkills")}`}
        </Text>

        {effectivePrimarySpell && (
          <div className="flex items-center justify-between p-1.5 bg-black/50 border border-cyan-800/60 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-300">
                <Sparkles size={12} />
              </div>
              <div className="flex flex-col">
                <Text weight="bold" size="2xs" className="text-cyan-300 leading-tight">
                  {effectivePrimarySpellName}
                </Text>
                <Text size="3xs" className="text-cyan-500">
                  {effectivePrimarySpell.manaCost} {t("manaUnit")}
                </Text>
              </div>
            </div>
            <KbdKey variant="cyan">{effectivePrimaryKeyLabel}</KbdKey>
          </div>
        )}

        {effectiveSecondarySpell && (
          <div className="flex items-center justify-between p-1.5 bg-black/50 border border-purple-800/60 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-purple-950/80 border border-purple-500 flex items-center justify-center text-purple-300">
                <Shield size={12} />
              </div>
              <div className="flex flex-col">
                <Text weight="bold" size="2xs" className="text-purple-300 leading-tight">
                  {effectiveSecondarySpellName}
                </Text>
                <Text size="3xs" className="text-purple-500">
                  {effectiveSecondarySpell.manaCost} {t("manaUnit")}
                </Text>
              </div>
            </div>
            <KbdKey variant="purple">{effectiveSecondaryKeyLabel}</KbdKey>
          </div>
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
          {potionSlots.map((pot) => {
            const hasPotion = !pot.isEmpty && pot.count > 0;
            const potionTitle = hasPotion && pot.nameKey
              ? `${t(pot.nameKey)} (${t("usePotion")})`
              : t("potionEmpty");

            return (
              <Button
                key={`pot-${effectivePlayerNumber}-${pot.slotIndex}`}
                type="button"
                variant="ghost"
                size="sm"
                title={potionTitle}
                aria-label={potionTitle}
                onClick={() => onUsePotion(pot.slotIndex)}
                className={cn(
                  "relative aspect-square h-auto p-1 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer shadow-none",
                  hasPotion
                    ? `bg-stone-900/80 ${potionBorderColor} hover:scale-105`
                    : "bg-black/30 border-stone-800 text-stone-700 opacity-60"
                )}
              >
                <FlaskConical
                  size={14}
                  className={
                    hasPotion
                      ? pot.healHp
                        ? "text-red-400"
                        : pot.healMana
                          ? "text-cyan-400"
                          : "text-amber-400"
                      : "text-stone-600"
                  }
                />
                {hasPotion && (
                  <Text weight="bold" size="3xs" className={cn("mt-0.5", potionTextColor)}>
                    x{pot.count}
                  </Text>
                )}
                <Code size="micro" className="absolute -bottom-1 -right-1 bg-black/80 px-1 rounded text-stone-400">
                  {pot.keyLabel}
                </Code>
              </Button>
            );
          })}
        </div>
      </div>

      {showRpgButtons && onOpenInventory && onOpenSkillTree && (
        <div className="grid grid-cols-2 gap-1.5 border-t border-stone-800/80 pt-2">
          <Button
            id="flank-inventory-btn"
            variant="secondary"
            size="sm"
            title={`${t("inventoryBtn")} [I]`}
            onClick={onOpenInventory}
            leftIcon={<Backpack size={13} />}
            className="h-7 py-1 px-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border-amber-700/60 text-amber-300"
          >
            <span>[I]</span>
          </Button>

          <Button
            id="flank-skilltree-btn"
            variant="secondary"
            size="sm"
            title={`${t("skillTreeBtn")} [K]`}
            onClick={onOpenSkillTree}
            leftIcon={<BookOpen size={13} />}
            className="h-7 py-1 px-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border-purple-700/60 text-purple-300"
          >
            <span>[K]</span>
          </Button>
        </div>
      )}
    </div>
  );
});
