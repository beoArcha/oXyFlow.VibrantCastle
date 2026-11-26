import React, { useState, useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGameSession } from "@context/GameSessionContext";
import { useSettings } from "@context/SettingsContext";
import {
  createStatsViewModel,
  getCurrentStats,
  subscribeToStats,
  resetGameStats,
  StatsSessionCard,
  StatsPlayerCard,
  StatsBreakdownCard,
  StatsWeaponsCard,
} from "@game-menu/menu/stats";

/**
 * Extracted SRP Statistics menu tab subscribed to live engine stats.
 */
export const StatsMenuTab: React.FC = () => {
  const { t } = useI18n();
  const { p1, p2 } = useGameSession();
  const { isTwoPlayer } = useSettings();
  const [statsSnapshot, setStatsSnapshot] = useState(() => getCurrentStats());

  useEffect(() => {
    return subscribeToStats(() => {
      setStatsSnapshot(getCurrentStats());
    });
  }, []);

  const statsVm = useMemo(
    () =>
      createStatsViewModel(
        statsSnapshot,
        isTwoPlayer,
        p1?.score ?? 0,
        p2?.score ?? 0,
        t
      ),
    [statsSnapshot, isTwoPlayer, p1?.score, p2?.score, t]
  );

  return (
    <div className="flex flex-col gap-4">
      <StatsSessionCard summary={statsVm.sessionSummary} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsPlayerCard
          title={t("p1Status")}
          stats={statsVm.p1Stats}
          variant="amber"
        />
        {statsVm.p2Stats && (
          <StatsPlayerCard
            title={t("p2Status")}
            stats={statsVm.p2Stats}
            variant="cyan"
          />
        )}
      </div>
      <StatsBreakdownCard
        kills={statsVm.killsBreakdown}
        potions={statsVm.potionsBreakdown}
      />
      <StatsWeaponsCard weapons={statsVm.weaponsEfficacy} />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={13} />}
          onClick={() => setStatsSnapshot(resetGameStats())}
          className="whitespace-nowrap shrink-0"
        >
          {t("resetStatsBtn")}
        </Button>
      </div>
    </div>
  );
};

StatsMenuTab.displayName = "StatsMenuTab";
export default StatsMenuTab;
