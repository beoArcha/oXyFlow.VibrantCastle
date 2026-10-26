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
 * Renders an equipped spell slot with icon badge, spell name, mana cost, and shortcut key.
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

  const borderColor = isCyan ? "border-cyan-800/60" : "border-purple-800/60";
  const iconBoxClass = isCyan
    ? "bg-cyan-950/80 border-cyan-500 text-cyan-300"
    : "bg-purple-950/80 border-purple-500 text-purple-300";
  const nameColor = isCyan ? "text-cyan-300" : "text-purple-300";
  const manaColor = isCyan ? "text-cyan-500" : "text-purple-500";
  const kbdVariant = isCyan ? "cyan" : "purple";

  const defaultIcon = isCyan ? <Sparkles size={12} /> : <Shield size={12} />;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-1.5 bg-black/50 border rounded-xl",
        borderColor,
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "w-6 h-6 rounded-lg border flex items-center justify-center",
            iconBoxClass
          )}
        >
          {icon ?? defaultIcon}
        </div>
        <div className="flex flex-col">
          <Text weight="bold" size="2xs" className={cn("leading-tight", nameColor)}>
            {spellName}
          </Text>
          <Text size="3xs" className={manaColor}>
            {spell.manaCost} {t("manaUnit")}
          </Text>
        </div>
      </div>
      <KbdKey variant={kbdVariant}>{keyLabel}</KbdKey>
    </div>
  );
});

HUDSpellSlot.displayName = "HUDSpellSlot";
export default HUDSpellSlot;
