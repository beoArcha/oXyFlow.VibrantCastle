import React from "react";
import { Palette, Zap, Activity, Flame, Cpu } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  SettingToggleRow,
  SettingOptionCard,
} from "@components/ui";
import { useSettings } from "@context/SettingsContext";
import { useI18n } from "@context/I18nContext";
import type { TargetFps, AssetQuality } from "@context/settingsTypes";
import { cn } from "@lib/utils";

export interface GraphicsQualitySectionProps {
  readonly className?: string;
}

export const GraphicsQualitySection = ({
  className,
}: GraphicsQualitySectionProps = {}): React.ReactElement => {
  const { displaySettings, setDisplaySettings } = useSettings();
  const { t } = useI18n();

  const fpsTargets: ReadonlyArray<{
    fps: TargetFps;
    step: number;
    frameTime: string;
    multiplier: string;
  }> = [
    { fps: 30, step: 2, frameTime: "33.3ms", multiplier: "2.00x" },
    { fps: 60, step: 4, frameTime: "16.6ms", multiplier: "1.00x" },
    { fps: 90, step: 6, frameTime: "11.1ms", multiplier: "0.67x" },
    { fps: 120, step: 8, frameTime: "8.3ms", multiplier: "0.50x" },
  ];

  const assetQualities: ReadonlyArray<{
    id: AssetQuality;
    title: string;
    tierTag: string;
    descKey: string;
  }> = [
    {
      id: "low",
      title: t("assetQualityLow"),
      tierTag: "16-Bit Classic (36×52)",
      descKey: "assetQualityLowDesc",
    },
    {
      id: "mid",
      title: t("assetQualityMid"),
      tierTag: "16-Bit Mobile HD (52×66)",
      descKey: "assetQualityMidDesc",
    },
    {
      id: "high",
      title: t("assetQualityHigh"),
      tierTag: "HiPixel Masterclass (72×84)",
      descKey: "assetQualityHighDesc",
    },
  ];

  const activeFps = displaySettings.targetFps || 60;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Activity className="w-4 h-4 text-amber-400" />}>
              {t("targetFpsOption")}
            </CardTitle>
            <Badge variant="amber" className="font-mono text-[10px]">
              {activeFps} FPS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {fpsTargets.map((item) => (
              <SettingOptionCard
                key={item.fps}
                id={`fps-target-${item.fps}`}
                selected={activeFps === item.fps}
                onSelect={() => setDisplaySettings({ targetFps: item.fps })}
                title={`${item.fps} FPS`}
                description={`${item.frameTime} • ${item.multiplier} dt`}
              />
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-[#5c2d18]/50 text-xs text-stone-300 leading-relaxed">
            <p className="font-medium text-amber-300/95">
              {activeFps === 30 && t("fps30Desc")}
              {activeFps === 60 && t("fps60Desc")}
              {activeFps === 90 && t("fps90Desc")}
              {activeFps === 120 && t("fps120Desc")}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">{t("fpsMultipliersDesc")}</p>
          </div>

          <SettingToggleRow
            id="fps-counter-toggle"
            icon={<Activity className="w-3.5 h-3.5" />}
            title={t("fpsCounterOption")}
            checked={!!displaySettings.showFpsCounter}
            onCheckedChange={(checked) => setDisplaySettings({ showFpsCounter: checked })}
          />
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Cpu className="w-4 h-4 text-amber-400" />}>
              {t("gpuAccelerationBadge")}
            </CardTitle>
            <Badge
              variant={displaySettings.hardwareAcceleration !== false ? "amber" : "stone"}
              className="font-mono text-[10px]"
            >
              {displaySettings.hardwareAcceleration !== false ? "GPU: ACTIVE" : "GPU: DISABLED"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SettingToggleRow
            id="gpu-acceleration-toggle"
            icon={<Zap className="w-3.5 h-3.5" />}
            title={t("gpuAccelerationOption")}
            description={t("gpuAccelerationDesc")}
            checked={displaySettings.hardwareAcceleration !== false}
            onCheckedChange={(checked) => setDisplaySettings({ hardwareAcceleration: checked })}
          />
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Palette className="w-4 h-4 text-amber-400" />}>
              {t("assetQualityOption")}
            </CardTitle>
            <Badge variant="amber" className="font-mono text-[10px]">
              {displaySettings.assetQuality.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {assetQualities.map((item) => (
              <SettingOptionCard
                key={item.id}
                id={`asset-quality-${item.id}`}
                selected={displaySettings.assetQuality === item.id}
                onSelect={() => setDisplaySettings({ assetQuality: item.id })}
                title={item.title}
                badge={
                  <span className="text-[10px] font-mono text-amber-400/90">
                    {item.tierTag}
                  </span>
                }
                description={t(item.descKey)}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium px-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("assetValenIdentity")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

