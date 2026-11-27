import React, { useState, useEffect, useMemo } from "react";
import { RotateCcw, ScrollText } from "lucide-react";
import { Button, ConfirmDialog, Heading, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGameSession } from "@context/GameSessionContext";
import { useSettings } from "@context/SettingsContext";
import { ReservedFeatureCard } from "@game-menu/common";
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
  const [confirmReset, setConfirmReset] = useState(false);

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

  const isEmpty =
    statsVm.sessionSummary.totalKills === 0 &&
    statsVm.sessionSummary.totalDamageDealt === 0 &&
    statsVm.sessionSummary.totalPotionsConsumed === 0 &&
    statsVm.sessionSummary.leversPulled === 0 &&
    statsSnapshot.totalPlayTimeSeconds === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ScrollText size={16} className="text-amber-400 shrink-0" />
        <Heading level={3} size="base" variant="primary">
          {t("chronicleTitle")}
        </Heading>
      </div>
      {isEmpty ? (
        <Paragraph size="sm" variant="muted">
          {t("statsEmptyState")}
        </Paragraph>
      ) : (
        <StatsSessionCard summary={statsVm.sessionSummary} />
      )}
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
      <ReservedFeatureCard
        titleKey="reservedAttributesTitle"
        descriptionKey="reservedAttributesDesc"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={13} />}
          onClick={() => setConfirmReset(true)}
          className="whitespace-nowrap shrink-0"
        >
          {t("resetStatsBtn")}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          setStatsSnapshot(resetGameStats());
        }}
        title={t("statsResetConfirmTitle")}
        message={t("statsResetConfirmMessage")}
        confirmLabel={t("statsResetConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />
    </div>
  );
};

StatsMenuTab.displayName = "StatsMenuTab";
export default StatsMenuTab;
