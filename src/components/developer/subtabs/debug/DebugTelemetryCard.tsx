import React, { useMemo } from "react";
import { Activity, Gauge, Zap, Sparkles, Crosshair, Map, Video } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, BadgeVariant, MetricTile } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { TelemetryMetricItem } from "./types";

export interface DebugTelemetryProps {
  measuredFps: number;
  targetFps: number;
  frameTimeMs: number;
  particleCount: number;
  projectileCount: number;
  enemyCount: number;
  entityCount: number;
  cameraX: number;
  cameraY: number;
  levelWidth: number;
  levelHeight: number;
}

export const DebugTelemetryCard: React.FC<DebugTelemetryProps> = React.memo(function DebugTelemetryCard({
  measuredFps,
  targetFps,
  frameTimeMs,
  particleCount,
  projectileCount,
  enemyCount,
  entityCount,
  cameraX,
  cameraY,
  levelWidth,
  levelHeight,
}) {
  const { t } = useI18n();

  const fpsBadgeVariant: BadgeVariant =
    measuredFps >= targetFps - 5 ? "green" : measuredFps >= 30 ? "amber" : "red";

  const safeFrameTime =
    Number.isFinite(frameTimeMs) && frameTimeMs >= 0
      ? frameTimeMs
      : measuredFps > 0
        ? 1000 / measuredFps
        : 16.6;

  const metrics: TelemetryMetricItem[] = useMemo(
    () => [
      {
        id: "fps",
        label: t("debugMetricFps"),
        icon: <Gauge size={13} />,
        value: measuredFps,
        subtext: `/ ${targetFps}`,
        variant: "emerald",
      },
      {
        id: "frameTime",
        label: t("debugMetricFrameTime"),
        icon: <Activity size={13} />,
        value: safeFrameTime.toFixed(1),
        subtext: t("debugUnitMs"),
        variant: "amber",
      },
      {
        id: "particles",
        label: t("debugMetricParticles"),
        icon: <Sparkles size={13} />,
        value: particleCount,
        variant: "amber",
      },
      {
        id: "projectiles",
        label: t("debugMetricProjectiles"),
        icon: <Zap size={13} />,
        value: projectileCount,
        variant: "cyan",
      },
      {
        id: "enemies",
        label: t("debugMetricEnemies"),
        icon: <Crosshair size={13} />,
        value: enemyCount,
        variant: "rose",
      },
      {
        id: "entities",
        label: t("debugMetricEntities"),
        icon: <Map size={13} />,
        value: entityCount,
        variant: "purple",
      },
      {
        id: "camera",
        label: t("debugMetricCamera"),
        icon: <Video size={13} />,
        value: `X: ${Math.round(cameraX)}, Y: ${Math.round(cameraY)}`,
        variant: "blue",
      },
      {
        id: "world",
        label: t("debugMetricWorld"),
        icon: <Map size={13} />,
        value: `${levelWidth} × ${levelHeight}`,
        subtext: t("debugUnitPx"),
        variant: "stone",
      },
    ],
    [
      t,
      measuredFps,
      targetFps,
      safeFrameTime,
      particleCount,
      projectileCount,
      enemyCount,
      entityCount,
      cameraX,
      cameraY,
      levelWidth,
      levelHeight,
    ]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Activity className="w-4 h-4 text-emerald-400" />}>
          {t("debugTelemetryTitle")}
        </CardTitle>
        <Badge variant={fpsBadgeVariant}>
          {measuredFps} {t("debugUnitFps")} / {targetFps}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {metrics.map((metric) => (
          <MetricTile
            key={metric.id}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            variant={metric.variant}
          />
        ))}
      </CardContent>
    </Card>
  );
});

DebugTelemetryCard.displayName = "DebugTelemetryCard";

export default DebugTelemetryCard;
