import React from "react";
import { Activity, Gauge, Zap, Sparkles, Crosshair, Map, Video } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, BadgeVariant } from "@components/ui";
import { useI18n } from "@hooks/useI18n";

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

export const DebugTelemetryCard: React.FC<DebugTelemetryProps> = ({
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
}) => {
  const { t } = useI18n();

  const fpsBadgeVariant: BadgeVariant =
    measuredFps >= targetFps - 5 ? "green" : measuredFps >= 30 ? "amber" : "red";

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Activity className="w-4 h-4 text-emerald-400" />}>
          {t("debugTelemetryTitle")}
        </CardTitle>
        <Badge variant={fpsBadgeVariant}>
          {measuredFps} FPS / {targetFps}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* FPS & Target */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Gauge size={13} className="text-emerald-400" />
            <span>{t("debugMetricFps")}</span>
          </div>
          <span className="text-base font-bold font-mono text-emerald-300 mt-1">
            {measuredFps}{" "}
            <span className="text-xs text-stone-500 font-normal">/ {targetFps}</span>
          </span>
        </div>

        {/* Frame Time */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Activity size={13} className="text-amber-400" />
            <span>{t("debugMetricFrameTime")}</span>
          </div>
          <span className="text-base font-bold font-mono text-amber-300 mt-1">
            {frameTimeMs.toFixed(1)}{" "}
            <span className="text-xs text-stone-500 font-normal">ms</span>
          </span>
        </div>

        {/* Particles Count */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Sparkles size={13} className="text-yellow-400" />
            <span>{t("debugMetricParticles")}</span>
          </div>
          <span className="text-base font-bold font-mono text-yellow-300 mt-1">
            {particleCount}
          </span>
        </div>

        {/* Projectiles Count */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Zap size={13} className="text-cyan-400" />
            <span>{t("debugMetricProjectiles")}</span>
          </div>
          <span className="text-base font-bold font-mono text-cyan-300 mt-1">
            {projectileCount}
          </span>
        </div>

        {/* Enemy Count */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Crosshair size={13} className="text-rose-400" />
            <span>{t("debugMetricEnemies")}</span>
          </div>
          <span className="text-base font-bold font-mono text-rose-300 mt-1">
            {enemyCount}
          </span>
        </div>

        {/* Interactive Entities Count */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Map size={13} className="text-purple-400" />
            <span>{t("debugMetricEntities")}</span>
          </div>
          <span className="text-base font-bold font-mono text-purple-300 mt-1">
            {entityCount}
          </span>
        </div>

        {/* Camera Coordinates */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Video size={13} className="text-blue-400" />
            <span>{t("debugMetricCamera")}</span>
          </div>
          <span className="text-xs font-bold font-mono text-blue-300 mt-1">
            X: {Math.round(cameraX)}, Y: {Math.round(cameraY)}
          </span>
        </div>

        {/* Level Dimensions */}
        <div className="flex flex-col p-2.5 bg-[#140602] rounded-xl border border-stone-800">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
            <Map size={13} className="text-stone-400" />
            <span>{t("debugMetricWorld")}</span>
          </div>
          <span className="text-xs font-bold font-mono text-stone-300 mt-1">
            {levelWidth} × {levelHeight} px
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugTelemetryCard;
