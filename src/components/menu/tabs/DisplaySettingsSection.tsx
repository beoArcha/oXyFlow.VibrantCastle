import React, { useState, useEffect } from "react";
import {
  Monitor,
  Palette,
  Sparkles,
  Zap,
  Maximize2,
  Minimize2,
  Tv,
  Check,
  Activity,
  Layers,
  Flame,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "../../ui";
import { useSettings } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import { AspectRatioMode, ScalingFilterMode, TargetFps, AssetQuality } from "../../../game/types";
import { cn } from "../../../lib/utils";

export const DisplaySettingsSection: React.FC = () => {
  const { displaySettings, setDisplaySettings } = useSettings();
  const { t } = useI18n();

  // Fullscreen state and handler
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed or not permitted:", err);
    }
  };

  const aspectRatios: Array<{
    id: AspectRatioMode;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "auto",
      label: t("aspectRatioAutoFill"),
      subLabel: t("aspectRatioAutoFillDesc"),
      icon: <Maximize2 size={15} />,
    },
    {
      id: "16:9",
      label: "16:9",
      subLabel: t("aspectRatio169Desc"),
      icon: <Tv size={15} />,
    },
    {
      id: "16:10",
      label: "16:10",
      subLabel: t("aspectRatio1610Desc"),
      icon: <Monitor size={15} />,
    },
    {
      id: "4:3",
      label: "4:3",
      subLabel: t("aspectRatio43Desc"),
      icon: <Layers size={15} />,
    },
  ];

  const scalingModes: Array<{
    id: ScalingFilterMode;
    title: string;
    desc: string;
  }> = [
    {
      id: "pixel",
      title: t("scalingPixelTitle"),
      desc: t("scalingPixelDesc"),
    },
    {
      id: "smooth",
      title: t("scalingSmoothTitle"),
      desc: t("scalingSmoothDesc"),
    },
  ];

  const fpsTargets: Array<{
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

  const assetQualities: Array<{
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

  return (
    <>
      {/* 1. EKRAN I PROPORCJE OBRAZU (Aspect Ratio & Fullscreen) */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Monitor className="w-4 h-4 text-amber-400" />}>
              {t("aspectRatioTitle")}
            </CardTitle>
            <Badge variant="amber" className="font-mono text-[10px]">
              {displaySettings.aspectRatio.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Proportions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {aspectRatios.map((item) => {
              const isSelected = displaySettings.aspectRatio === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDisplaySettings({ aspectRatio: item.id })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                    isSelected
                      ? "bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-400/50"
                      : "bg-[#140602] border-stone-800 hover:border-amber-700/60 hover:bg-[#1f0a03]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-bold text-sm", isSelected ? "text-amber-300" : "text-stone-300")}>
                      {item.label}
                    </span>
                    <span className={isSelected ? "text-amber-400" : "text-stone-500"}>{item.icon}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 leading-tight">{item.subLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Fullscreen Trigger Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#140602] border border-[#5c2d18]/40">
            <div className="flex items-center gap-2">
              <Maximize2 size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-stone-200">
                  {t("fullscreenTitle")}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isFullscreen ? t("fullscreenActiveDesc") : t("fullscreenInactiveDesc")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isFullscreen ? "secondary" : "primary"}
              icon={isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              onClick={handleToggleFullscreen}
            >
              {isFullscreen ? t("fullscreenExitBtn") : t("fullscreenEnterBtn")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. FILTR SKALOWANIA PŁÓTNA (Pixel vs Smooth) */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
              {t("scalingOption")}
            </CardTitle>
            <Badge variant="stone" className="font-mono text-[10px]">
              {displaySettings.scalingFilter === "pixel" ? "NEAREST" : "BILINEAR"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {scalingModes.map((mode) => {
              const isSelected = displaySettings.scalingFilter === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDisplaySettings({ scalingFilter: mode.id })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                    isSelected
                      ? "bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-400/50"
                      : "bg-[#140602] border-stone-800 hover:border-amber-700/60 hover:bg-[#1f0a03]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-bold text-xs", isSelected ? "text-amber-300" : "text-stone-300")}>
                      {mode.title}
                    </span>
                    {isSelected && <Check size={14} className="text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. PŁYNNOŚĆ I CZĘSTOTLIWOŚĆ KLATEK (FPS Target & Physics Delta) */}
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Zap className="w-4 h-4 text-amber-400" />}>
              {t("fpsOption")}
            </CardTitle>
            <Badge variant="purple" className="font-mono text-[10px]">
              15-FPS QUANTUM DELTA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* FPS Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fpsTargets.map((item) => {
              const isSelected = (displaySettings.targetFps || 60) === item.fps;
              return (
                <button
                  key={item.fps}
                  type="button"
                  onClick={() => setDisplaySettings({ targetFps: item.fps })}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                    isSelected
                      ? "bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-400/50"
                      : "bg-[#140602] border-stone-800 hover:border-amber-700/60 hover:bg-[#1f0a03]"
                  )}
                >
                  <span className={cn("text-base font-extrabold font-mono", isSelected ? "text-amber-300" : "text-stone-300")}>
                    {item.fps} FPS
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400">
                    <span>{item.frameTime}</span>
                    <span>•</span>
                    <span className="text-amber-400/90">{item.multiplier} dt</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Description of active FPS configuration */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-[#5c2d18]/50 text-xs text-stone-300 leading-relaxed">
            <p className="font-medium text-amber-300/95">
              {(displaySettings.targetFps || 60) === 30 && t("fps30Desc")}
              {(displaySettings.targetFps || 60) === 60 && t("fps60Desc")}
              {(displaySettings.targetFps || 60) === 90 && t("fps90Desc")}
              {(displaySettings.targetFps || 60) === 120 && t("fps120Desc")}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">
              {t("fpsMultipliersDesc")}
            </p>
          </div>

          {/* On-screen FPS counter toggle checkbox */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#140602] border border-[#5c2d18]/40">
            <label
              htmlFor="fps-counter-toggle"
              className="text-xs font-semibold text-stone-300 flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("fpsCounterOption")}</span>
            </label>
            <input
              id="fps-counter-toggle"
              type="checkbox"
              checked={!!displaySettings.showFpsCounter}
              onChange={(e) => setDisplaySettings({ showFpsCounter: e.target.checked })}
              className="w-4 h-4 rounded text-amber-600 bg-stone-900 border-stone-700 focus:ring-amber-500 cursor-pointer accent-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. JAKOŚĆ ZASOBÓW GRAFICZNYCH (HiPixel Asset Tier) */}
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
            {assetQualities.map((item) => {
              const isSelected = displaySettings.assetQuality === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDisplaySettings({ assetQuality: item.id })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                    isSelected
                      ? "bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-400/50"
                      : "bg-[#140602] border-stone-800 hover:border-amber-700/60 hover:bg-[#1f0a03]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-bold text-xs", isSelected ? "text-amber-300" : "text-stone-300")}>
                      {item.title}
                    </span>
                    {isSelected && <Check size={14} className="text-amber-400" />}
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/90">{item.tierTag}</span>
                  <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">{t(item.descKey)}</p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium px-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("assetValenIdentity")}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DisplaySettingsSection;
