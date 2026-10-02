import React from "react";
import { Sword, Shield, Heart, Sparkles, Zap } from "lucide-react";
import { StatRow } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import {
  InventoryStatsVM,
  DerivedStatsInput,
  resolveInventoryStatsVM,
} from "@components/adapters/inventoryAdapter";

export interface InventoryStatsProps {
  readonly stats?: InventoryStatsVM;
  readonly currentHp?: number;
  readonly currentMana?: number;
  readonly currentStamina?: number;
  readonly derivedStats?: DerivedStatsInput;
}

/**
 * Presentational card displaying current player combat vitals and derived attributes.
 */
export const InventoryStats = React.memo(function InventoryStats({
  stats,
  currentHp = 0,
  currentMana = 0,
  currentStamina = 0,
  derivedStats,
}: InventoryStatsProps) {
  const { t } = useI18n();

  const effectiveStats =
    stats ??
    resolveInventoryStatsVM(derivedStats, currentHp, currentMana, currentStamina);

  return (
    <div className="bg-stone-950/90 rounded-xl p-3 border border-stone-800 flex flex-col gap-1.5 mt-2">
      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
        {t("tabStats")}
      </span>
      <StatRow
        label={t("attackPower")}
        value={effectiveStats.attack}
        variant="amber"
        icon={<Sword size={13} />}
      />
      <StatRow
        label={t("defense")}
        value={effectiveStats.defense}
        variant="red"
        icon={<Shield size={13} />}
      />
      <StatRow
        label={t("health")}
        value={effectiveStats.hpDisplay}
        variant="red"
        icon={<Heart size={13} />}
      />
      <StatRow
        label={t("mana")}
        value={effectiveStats.manaDisplay}
        variant="cyan"
        icon={<Sparkles size={13} />}
      />
      <StatRow
        label={t("stamina")}
        value={effectiveStats.staminaDisplay}
        variant="amber"
        icon={<Zap size={13} />}
      />
    </div>
  );
});

InventoryStats.displayName = "InventoryStats";

export default InventoryStats;
