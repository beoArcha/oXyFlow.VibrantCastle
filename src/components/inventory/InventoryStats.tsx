import React from "react";
import { Sword, Shield, Heart, Sparkles, Zap } from "lucide-react";
import { StatRow } from "@components/ui";
import { useI18n } from "@hooks/useI18n";

export interface InventoryStatsProps {
  currentHp: number;
  currentMana: number;
  currentStamina: number;
  derivedStats: {
    totalAttack: number;
    totalDefense: number;
    maxHp: number;
    maxMana: number;
    maxStamina: number;
    manaRegen?: number;
    staminaRegen?: number;
  };
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  currentHp,
  currentMana,
  currentStamina,
  derivedStats,
}) => {
  const { t } = useI18n();

  return (
    <div className="bg-stone-950/90 rounded-xl p-3 border border-stone-800 flex flex-col gap-1.5 mt-2">
      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
        {t("tabStats")}
      </span>
      <StatRow
        label={t("attackPower")}
        value={derivedStats.totalAttack}
        variant="amber"
        icon={<Sword size={13} />}
      />
      <StatRow
        label={t("defense")}
        value={derivedStats.totalDefense}
        variant="red"
        icon={<Shield size={13} />}
      />
      <StatRow
        label={t("health")}
        value={`${Math.round(currentHp)} / ${derivedStats.maxHp}`}
        variant="red"
        icon={<Heart size={13} />}
      />
      <StatRow
        label={t("mana")}
        value={`${Math.round(currentMana)} / ${derivedStats.maxMana}`}
        variant="cyan"
        icon={<Sparkles size={13} />}
      />
      <StatRow
        label={t("stamina")}
        value={`${Math.round(currentStamina)} / ${derivedStats.maxStamina}`}
        variant="amber"
        icon={<Zap size={13} />}
      />
    </div>
  );
};

export default InventoryStats;
