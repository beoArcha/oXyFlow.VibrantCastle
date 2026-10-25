import React, { useState, useEffect } from "react";
import { useI18n } from "@context/I18nContext";
import { useSettings, useGameSession, useSaveGame } from "@context/GameContext";
import {
  createStatsViewModel,
  getCurrentStats,
  resetGameStats,
  subscribeToStats,
  type StatsViewModel,
} from "./stats/stats.mapper";
import {
  StatsSessionCard,
  StatsPlayerCard,
  StatsBreakdownCard,
  StatsWeaponsCard,
} from "./stats";
import { cn } from "@lib/utils";

export interface StatsPanelProps {
  readonly className?: string;
  readonly initialViewModel?: StatsViewModel;
}

export const StatsPanel = ({
  className,
  initialViewModel,
}: StatsPanelProps = {}): React.ReactElement => {
  const { t } = useI18n();
  const { isTwoPlayer } = useSettings();
  const { p1, p2 } = useGameSession();
  const { setSaveNotification } = useSaveGame();

  const [stats, setStats] = useState(() => getCurrentStats());
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStats(() => {
      setStats({ ...getCurrentStats() });
    });
    return () => unsubscribe();
  }, []);

  const handleResetStats = (): void => {
    const freshStats = resetGameStats();
    setStats({ ...freshStats });
    setResetConfirm(false);
    setSaveNotification(t("statsResetNotification"));
  };

  const viewModel =
    initialViewModel ??
    createStatsViewModel(stats, isTwoPlayer, p1?.score || 0, p2?.score || 0, t);

  return (
    <div
      id="game-statistics-panel"
      className={cn("flex flex-col gap-4 animate-in fade-in duration-150", className)}
    >
      <StatsSessionCard
        summary={viewModel.sessionSummary}
        resetConfirm={resetConfirm}
        onRequestReset={() => setResetConfirm(true)}
        onConfirmReset={handleResetStats}
        onCancelReset={() => setResetConfirm(false)}
      />

      <div className={isTwoPlayer ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        <StatsPlayerCard
          title={t("p1Status")}
          score={viewModel.p1Stats.score}
          stats={viewModel.p1Stats}
          variant="red"
        />
        {viewModel.p2Stats && (
          <StatsPlayerCard
            title={t("p2Status")}
            score={viewModel.p2Stats.score}
            stats={viewModel.p2Stats}
            variant="cyan"
          />
        )}
      </div>

      <StatsBreakdownCard
        kills={viewModel.killsBreakdown}
        potions={viewModel.potionsBreakdown}
        leversPulled={viewModel.sessionSummary.leversPulled}
      />

      <StatsWeaponsCard weapons={viewModel.weaponsEfficacy} />
    </div>
  );
};

export default StatsPanel;
