import React from "react";
import { Clock, Skull, Swords, FlaskConical, BarChart3, RotateCcw, HardDrive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import type { SessionSummaryVM } from "@components/adapters";
import { cn } from "@lib/utils";

export interface StatsSessionCardProps {
  readonly summary: SessionSummaryVM;
  readonly resetConfirm: boolean;
  readonly onRequestReset: () => void;
  readonly onConfirmReset: () => void;
  readonly onCancelReset: () => void;
  readonly className?: string;
}

export const StatsSessionCard = ({
  summary,
  resetConfirm,
  onRequestReset,
  onConfirmReset,
  onCancelReset,
  className,
}: StatsSessionCardProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn("border-amber-500/40 bg-[#1c0c07]/90", className)}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<BarChart3 className="w-5 h-5 text-amber-400" />}>
            {t("gameStatsTitle")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="amber" className="text-[10px] flex items-center gap-1">
              <HardDrive size={10} className="text-amber-400" />
              localStorage
            </Badge>
            {!resetConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestReset}
                icon={<RotateCcw size={12} />}
                className="text-xs h-7 px-2.5 border-stone-700 text-stone-300 hover:text-red-300 hover:border-red-700"
              >
                {t("resetStatsBtn")}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onConfirmReset}
                  icon={<RotateCcw size={12} />}
                  className="text-xs h-7 px-2.5"
                >
                  {t("resetStatsBtn")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelReset}
                  className="text-xs h-7 px-2"
                >
                  ✕
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[#fed7aa] mb-3 leading-relaxed">
          {t("gameStatsSubtitle")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Clock size={12} className="text-amber-400" />
              {t("playTime")}
            </span>
            <span className="font-mono font-bold text-sm text-amber-200 mt-1">
              {summary.formattedPlayTime}
            </span>
          </div>

          <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Skull size={12} className="text-red-400" />
              {t("totalKills")}
            </span>
            <span className="font-mono font-bold text-sm text-red-300 mt-1">
              {summary.totalKills}
            </span>
          </div>

          <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Swords size={12} className="text-amber-400" />
              {t("damageDealt")}
            </span>
            <span className="font-mono font-bold text-sm text-amber-300 mt-1">
              {summary.totalDamageDealt}
            </span>
          </div>

          <div className="bg-[#140602]/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <FlaskConical size={12} className="text-cyan-400" />
              {t("potionsConsumed")}
            </span>
            <span className="font-mono font-bold text-sm text-cyan-300 mt-1">
              {summary.totalPotionsConsumed}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
