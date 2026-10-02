import React from "react";
import { FastForward, StepForward, Eye, Activity } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Switch } from "@components/ui";
import { useI18n } from "@context/I18nContext";

import { TesterTimeAndDiagnosticsCardProps } from "./types";

export const TesterTimeAndDiagnosticsCard: React.FC<TesterTimeAndDiagnosticsCardProps> = ({
  timeScale,
  showHitboxes,
  showProfiler,
  onSetTimeScale,
  onStepSingleFrame,
  onToggleHitboxes,
  onToggleProfiler,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      {/* Simulation Speed & Time Scale */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<FastForward className="w-4 h-4 text-amber-400" />}>
            {t("testerSpeedTitle")}
          </CardTitle>
          <Badge variant="stone">{timeScale}x</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0.25, 0.5, 1.0, 2.0, 4.0].map((scale) => (
              <Button
                key={scale}
                size="sm"
                variant={timeScale === scale ? "primary" : "secondary"}
                onClick={() => onSetTimeScale(scale)}
              >
                {scale === 1.0 ? t("testerNormalSpeed") : `${scale}x`}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<StepForward size={14} />}
            onClick={onStepSingleFrame}
          >
            {t("testerStepFrameBtn")}
          </Button>
        </CardContent>
      </Card>

      {/* Hitboxes & Profiler Overlay */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
            {t("testerHitboxesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-2">
              <Eye size={14} className={showHitboxes ? "text-amber-400" : "text-stone-400"} />
              <span className="text-xs font-semibold text-stone-200">{t("testerHitboxesLabel")}</span>
            </div>
            <Switch
              checked={showHitboxes}
              onCheckedChange={onToggleHitboxes}
              size="sm"
              aria-label={t("testerHitboxesLabel")}
            />
          </div>
          <div className="flex items-center justify-between p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-2">
              <Activity size={14} className={showProfiler ? "text-amber-400" : "text-stone-400"} />
              <span className="text-xs font-semibold text-stone-200">{t("testerProfilerLabel")}</span>
            </div>
            <Switch
              checked={showProfiler}
              onCheckedChange={onToggleProfiler}
              size="sm"
              aria-label={t("testerProfilerLabel")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesterTimeAndDiagnosticsCard;
