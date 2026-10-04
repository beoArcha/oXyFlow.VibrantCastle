import React, { useMemo } from "react";
import { Eye, Activity, Crosshair, Ghost } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Switch } from "@ui";
import { useI18n } from "@context/I18nContext";
import { DebugSensorToggle } from "./types";

export interface DebugTogglesProps {
  showHitboxes: boolean;
  showProfiler: boolean;
  clickToTeleport: boolean;
  freezeAI: boolean;
  onToggleHitboxes?: () => void;
  onToggleProfiler?: () => void;
  onToggleClickToTeleport?: () => void;
  onToggleFreezeAI?: () => void;
}

export const DebugTogglesCard: React.FC<DebugTogglesProps> = React.memo(function DebugTogglesCard({
  showHitboxes,
  showProfiler,
  clickToTeleport,
  freezeAI,
  onToggleHitboxes,
  onToggleProfiler,
  onToggleClickToTeleport,
  onToggleFreezeAI,
}) {
  const { t } = useI18n();

  const sensorToggles: DebugSensorToggle[] = useMemo(
    () => [
      {
        id: "hitboxes",
        label: t("debugToggleHitboxes"),
        icon: <Eye size={14} className={showHitboxes ? "text-amber-400" : "text-stone-400"} />,
        checked: showHitboxes,
        onToggle: onToggleHitboxes,
      },
      {
        id: "profiler",
        label: t("debugToggleProfiler"),
        icon: <Activity size={14} className={showProfiler ? "text-amber-400" : "text-stone-400"} />,
        checked: showProfiler,
        onToggle: onToggleProfiler,
      },
      {
        id: "clickToTeleport",
        label: t("testerClickTeleportLabel"),
        icon: <Crosshair size={14} className={clickToTeleport ? "text-amber-400" : "text-stone-400"} />,
        checked: clickToTeleport,
        onToggle: onToggleClickToTeleport,
      },
      {
        id: "freezeAI",
        label: t("testerFreezeAiLabel"),
        icon: <Ghost size={14} className={freezeAI ? "text-amber-400" : "text-stone-400"} />,
        checked: freezeAI,
        onToggle: onToggleFreezeAI,
      },
    ],
    [
      t,
      showHitboxes,
      showProfiler,
      clickToTeleport,
      freezeAI,
      onToggleHitboxes,
      onToggleProfiler,
      onToggleClickToTeleport,
      onToggleFreezeAI,
    ]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
          {t("debugToggleSensorsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {sensorToggles.map((sensor) => (
          <div
            key={sensor.id}
            className="flex items-center justify-between p-2.5 bg-[#140602] border border-stone-800 rounded-lg hover:border-stone-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              {sensor.icon}
              <span className="text-xs font-semibold text-stone-200">{sensor.label}</span>
            </div>
            <Switch
              checked={sensor.checked}
              onCheckedChange={sensor.onToggle}
              size="sm"
              aria-label={sensor.label}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

DebugTogglesCard.displayName = "DebugTogglesCard";

export default DebugTogglesCard;
