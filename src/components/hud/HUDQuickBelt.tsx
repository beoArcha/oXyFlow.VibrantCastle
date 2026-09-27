import React from "react";
import { Sparkles, Shield, FlaskConical, Backpack, BookOpen } from "lucide-react";
import { KbdKey } from "@components/ui";
import { useI18n } from "@hooks/useI18n";
import { HUDQuickBeltProps } from "./types";
import { cn } from "@lib/utils";

/**
 * Left or Right flank action belt displaying active spells, quick potion slots, and RPG shortcuts.
 */
export const HUDQuickBelt: React.FC<HUDQuickBeltProps> = React.memo(({
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
  const isP1 = playerNumber === 1;

  const borderColor = isP1 ? "border-red-950/70" : "border-cyan-950/70";
  const titleColor = isP1 ? "text-stone-400" : "text-cyan-400";
  const potionBorderColor = isP1 ? "border-amber-600/70 hover:border-amber-400" : "border-cyan-600/70 hover:border-cyan-400";
  const potionTextColor = isP1 ? "text-amber-200" : "text-cyan-200";

  return (
    <div
      className={cn(
        "bg-[#140602]/85 backdrop-blur-md p-2.5 rounded-2xl border shadow-2xl flex flex-col gap-3 max-w-[200px]",
        borderColor
      )}
    >
      {/* Equipped Spells */}
      <div className="flex flex-col gap-1.5">
        <span className={cn("text-[10px] font-bold tracking-wider uppercase", titleColor)}>
          {isP1 ? t("tabSkills") : `P2 ${t("tabSkills")}`}
        </span>

        {/* Primary Spell Card */}
        {primarySpell && (
          <div className="flex items-center justify-between p-1.5 bg-black/50 border border-cyan-800/60 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-cyan-300">
                <Sparkles size={12} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-cyan-300 leading-tight">
                  {primarySpellName}
                </span>
                <span className="text-[9px] text-cyan-500">
                  {primarySpell.manaCost} {t("manaUnit")}
                </span>
              </div>
            </div>
            <KbdKey variant="cyan">{primaryKeyLabel}</KbdKey>
          </div>
        )}

        {/* Secondary Spell Card */}
        {secondarySpell && (
          <div className="flex items-center justify-between p-1.5 bg-black/50 border border-purple-800/60 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-purple-950/80 border border-purple-500 flex items-center justify-center text-purple-300">
                <Shield size={12} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-purple-300 leading-tight">
                  {secondarySpellName}
                </span>
                <span className="text-[9px] text-purple-500">
                  {secondarySpell.manaCost} {t("manaUnit")}
                </span>
              </div>
            </div>
            <KbdKey variant="purple">{secondaryKeyLabel}</KbdKey>
          </div>
        )}
      </div>

      {/* Quick Potions Belt (3 Slots) */}
      <div className="flex flex-col gap-1.5 border-t border-[#3a1a0f] pt-2">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-amber-400">
          <span>{t("quickPotions")}</span>
          <span className="text-[9px] text-stone-500">{potionKeyRangeLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((slotIdx) => {
            const pot = player.inventory.quickPotions[slotIdx];
            return (
              <button
                key={`pot-${playerNumber}-${slotIdx}`}
                title={pot ? `${t(pot.nameKey)} (${t("usePotion")})` : t("potionEmpty")}
                onClick={() => onUsePotion(slotIdx)}
                className={cn(
                  "relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition-all cursor-pointer",
                  pot
                    ? `bg-[#26120b] ${potionBorderColor} hover:scale-105`
                    : "bg-black/30 border-stone-800 text-stone-700 opacity-60"
                )}
              >
                <FlaskConical
                  size={14}
                  className={
                    pot
                      ? pot.healHp
                        ? "text-red-400"
                        : pot.healMana
                          ? "text-cyan-400"
                          : "text-amber-400"
                      : "text-stone-600"
                  }
                />
                {pot && (
                  <span className={cn("text-[9px] font-bold mt-0.5", potionTextColor)}>
                    x{pot.count || 1}
                  </span>
                )}
                <span className="absolute -bottom-1 -right-1 text-[8px] bg-black/80 px-1 rounded font-mono text-stone-400">
                  {isP1 ? slotIdx + 1 : slotIdx + 7}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick RPG Panel Buttons */}
      {showRpgButtons && onOpenInventory && onOpenSkillTree && (
        <div className="grid grid-cols-2 gap-1.5 border-t border-[#3a1a0f] pt-2">
          <button
            id="flank-inventory-btn"
            title={`${t("inventoryBtn")} [I] - No Pause`}
            onClick={onOpenInventory}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#26120b] hover:bg-[#3d1b0e] border border-amber-700/60 text-amber-300 text-[11px] font-bold cursor-pointer transition-all"
          >
            <Backpack size={13} />
            <span>[I]</span>
          </button>

          <button
            id="flank-skilltree-btn"
            title={`${t("skillTreeBtn")} [K] - No Pause`}
            onClick={onOpenSkillTree}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#26120b] hover:bg-[#3d1b0e] border border-purple-700/60 text-purple-300 text-[11px] font-bold cursor-pointer transition-all"
          >
            <BookOpen size={13} />
            <span>[K]</span>
          </button>
        </div>
      )}
    </div>
  );
});
