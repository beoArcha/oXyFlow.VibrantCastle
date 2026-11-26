import React from "react";
import { Sparkles, Shield } from "lucide-react";
import { Text, KbdKey } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import type { MagicSkill } from "@game/types";
import type { SpellItemVM } from "../../types";

export interface HUDSpellSlotProps {
  readonly spell: SpellItemVM | MagicSkill;
  readonly spellName: string;
  readonly keyLabel: string;
  readonly variant?: "cyan" | "purple";
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

/**
 * Renders a compact horizontal spell slot for the bottom action dock
 * with icon badge, spell name, effective mana cost, affordability cue, and shortcut key.
 */
export const HUDSpellSlot: React.FC<HUDSpellSlotProps> = React.memo(({
  spell,
  spellName,
  keyLabel,
  variant = "cyan",
  icon,
  className,
}) => {
  const { t } = useI18n();
  const isCyan = variant === "cyan";
  const canAfford = "canAfford" in spell && spell.canAfford !== undefined ? spell.canAfford : true;

  const borderColor = isCyan ? "border-cyan-800/60" : "border-purple-800/60";
  const iconBoxClass = isCyan
    ? "bg-cyan-950/80 border-cyan-500/70 text-cyan-300"
    : "bg-purple-950/80 border-purple-500/70 text-purple-300";
  const nameColor = isCyan ? "text-cyan-200" : "text-purple-200";
  const manaColor = canAfford
    ? isCyan
      ? "text-cyan-400"
      : "text-purple-400"
    : "text-stone-500";
  const kbdVariant = isCyan ? "cyan" : "purple";

  const defaultIcon = isCyan ? <Sparkles size={12} /> : <Shield size={12} />;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 bg-black/50 border rounded-lg whitespace-nowrap transition-opacity",
        borderColor,
        !canAfford && "opacity-55",
        className
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-md border flex items-center justify-center shrink-0",
          iconBoxClass
        )}
      >
        {icon ?? defaultIcon}
      </div>
      <div className="flex flex-col leading-none">
        <Text weight="bold" size="2xs" className={cn("leading-tight", nameColor)}>
          {t(spellName)}
        </Text>
        <Text size="3xs" family="mono" className={cn("tabular-nums", manaColor)}>
          {spell.manaCost} {t("manaUnit")}
        </Text>
      </div>
      <KbdKey variant={kbdVariant}>{keyLabel}</KbdKey>
    </div>
  );
});

HUDSpellSlot.displayName = "HUDSpellSlot";
export default HUDSpellSlot;
