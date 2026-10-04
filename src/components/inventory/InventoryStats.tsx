import React from "react";
import { Sword, Shield, Heart, Sparkles, Zap } from "lucide-react";
import { StatRow, Card } from "@ui";
import { useI18n } from "@context/I18nContext";
import { InventoryStatsVM } from "@components/adapters/inventoryAdapter";

export interface InventoryStatsProps {
  readonly stats: InventoryStatsVM;
}

/**
 * Presentational card displaying current player combat vitals and derived attributes.
 */
export const InventoryStats = React.memo(function InventoryStats({
  stats,
}: InventoryStatsProps) {
  const { t } = useI18n();

  return (
    <Card variant="dark" className="p-3 mt-2 flex flex-col gap-1.5 border-stone-800">
      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
        {t("tabStats")}
      </span>
      <StatRow
        label={t("attackPower")}
        value={stats.attack}
        variant="amber"
        icon={<Sword size={13} />}
      />
      <StatRow
        label={t("defense")}
        value={stats.defense}
        variant="red"
        icon={<Shield size={13} />}
      />
      <StatRow
        label={t("health")}
        value={stats.hpDisplay}
        variant="red"
        icon={<Heart size={13} />}
      />
      <StatRow
        label={t("mana")}
        value={stats.manaDisplay}
        variant="cyan"
        icon={<Sparkles size={13} />}
      />
      <StatRow
        label={t("stamina")}
        value={stats.staminaDisplay}
        variant="amber"
        icon={<Zap size={13} />}
      />
    </Card>
  );
});

InventoryStats.displayName = "InventoryStats";

export default InventoryStats;
