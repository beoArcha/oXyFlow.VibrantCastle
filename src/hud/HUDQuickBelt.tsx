import React, { useMemo } from "react";
import { Backpack, BookOpen } from "lucide-react";
import { Code, KeyboundButton } from "@ui";
import { useI18n } from "@context/I18nContext";
import { resolvePotionSlotsVM } from "./hud.mapper";
import { HUDPanel } from "./components/common/HUDPanel";
import { HUDSpellSlot } from "./components/belt/HUDSpellSlot";
import { HUDPotionSlotButton } from "./components/belt/HUDPotionSlotButton";
import type { HUDQuickBeltProps, PotionSlotVM } from "./types";
import { cn } from "@lib/utils";

/**
 * Compact horizontal bottom action dock containing the player's equipped spells
 * and 3 quick-use potion slots, keeping both playfield flanks unobstructed.
 */
export const HUDQuickBelt: React.FC<HUDQuickBeltProps> = React.memo(({
  belt,
  player,
  playerNumber,
  theme,
  primarySpell,
  secondarySpell,
  primarySpellName,
  secondarySpellName,
  primaryKeyLabel,
  secondaryKeyLabel,
  onUsePotion,
  onOpenInventory,
  onOpenSkillTree,
  showRpgButtons = false,
}) => {
  const { t } = useI18n();

  const effectivePlayerNumber = belt ? belt.playerNumber : (playerNumber ?? 1);
  const isP1 = effectivePlayerNumber === 1;
  const effectiveTheme = belt?.theme ?? theme ?? (isP1 ? "crimson" : "cyan");
  const isCyanTheme = effectiveTheme === "cyan";

  const effectivePrimarySpell = belt ? belt.primarySpell : primarySpell;
  const effectiveSecondarySpell = belt ? belt.secondarySpell : secondarySpell;
  const effectivePrimarySpellName = belt ? belt.primarySpellName : (primarySpellName ?? "");
  const effectiveSecondarySpellName = belt ? belt.secondarySpellName : (secondarySpellName ?? "");
  const effectivePrimaryKeyLabel = belt ? belt.primaryKeyLabel : (primaryKeyLabel ?? "");
  const effectiveSecondaryKeyLabel = belt ? belt.secondaryKeyLabel : (secondaryKeyLabel ?? "");

  const potionSlots: readonly PotionSlotVM[] = useMemo(() => {
    if (belt?.potions) return belt.potions;
    return resolvePotionSlotsVM(player?.inventory?.quickPotions, isP1);
  }, [belt?.potions, player?.inventory?.quickPotions, isP1]);

  const borderColor = isCyanTheme ? "border-cyan-800/50" : "border-amber-800/45";
  const potionBorderColor = isCyanTheme
    ? "border-cyan-600/60 hover:border-cyan-400"
    : "border-amber-600/60 hover:border-amber-400";
  const potionTextColor = isCyanTheme ? "text-cyan-200" : "text-amber-200";
  const hasSpells = Boolean(effectivePrimarySpell || effectiveSecondarySpell);

  return (
    <HUDPanel
      padding="none"
      borderColor={borderColor}
      className="px-2.5 py-1.5 flex items-center gap-2"
    >
      {effectivePlayerNumber === 2 && (
        <Code
          size="2xs"
          className={cn(
            "px-1.5 py-0.5 rounded border shrink-0",
            isCyanTheme
              ? "text-cyan-300 bg-cyan-950/60 border-cyan-700/40"
              : "text-amber-300 bg-amber-950/60 border-amber-700/40"
          )}
        >
          P2
        </Code>
      )}

      {hasSpells && (
        <div className="flex items-center gap-1.5">
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
      )}

      {hasSpells && <div className="h-6 w-px bg-stone-800/90 shrink-0" aria-hidden="true" />}

      <div className="flex items-center gap-1.5">
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

      {showRpgButtons && onOpenInventory && onOpenSkillTree && (
        <>
          <div className="h-6 w-px bg-stone-800/90 shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-1">
            <KeyboundButton
              id="flank-inventory-btn"
              variant="secondary"
              size="sm"
              title={`${t("inventoryBtn")} [I]`}
              onClick={onOpenInventory}
              leftIcon={<Backpack size={13} />}
              kbdKey="I"
              kbdVariant="amber"
              className="h-7 py-1 px-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 border-amber-700/60 text-amber-300"
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
              className="h-7 py-1 px-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 border-purple-700/60 text-purple-300"
            />
          </div>
        </>
      )}
    </HUDPanel>
  );
});

HUDQuickBelt.displayName = "HUDQuickBelt";
export default HUDQuickBelt;
