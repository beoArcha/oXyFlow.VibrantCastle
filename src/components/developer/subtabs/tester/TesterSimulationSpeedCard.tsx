import React, { useMemo } from "react";
import { FastForward, StepForward } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, SegmentedControl } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { TIME_SCALE_OPTIONS } from "./constants";
import { TesterSimulationSpeedCardProps } from "./types";

/**
 * Presentation card for simulation speed dilation and single frame stepping.
 */
export const TesterSimulationSpeedCard: React.FC<TesterSimulationSpeedCardProps> = ({
  timeScale,
  onSetTimeScale,
  onStepSingleFrame,
}) => {
  const { t } = useI18n();

  const options = useMemo(
    () =>
      TIME_SCALE_OPTIONS.map((scale) => ({
        value: scale,
        label: scale === 1.0 ? t("testerNormalSpeed") : `${scale}x`,
      })),
    [t]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<FastForward className="w-4 h-4 text-amber-400" />}>
          {t("testerSpeedTitle")}
        </CardTitle>
        <Badge variant="stone">{timeScale}x</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          options={options}
          value={timeScale}
          onChange={onSetTimeScale}
          size="sm"
        />

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
  );
};

export default TesterSimulationSpeedCard;
