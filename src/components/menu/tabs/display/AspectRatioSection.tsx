import React, { useState, useEffect } from "react";
import { Monitor, Maximize2, Minimize2, Tv, Layers } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, SettingOptionCard } from "@ui";
import { useSettings } from "@context/SettingsContext";
import { useI18n } from "@context/I18nContext";
import type { AspectRatioMode, ScalingFilterMode } from "@context/settingsTypes";
import { cn } from "@lib/utils";

export interface AspectRatioSectionProps {
  readonly className?: string;
}

export const AspectRatioSection = ({
  className,
}: AspectRatioSectionProps = {}): React.ReactElement => {
  const { displaySettings, setDisplaySettings } = useSettings();
  const { t } = useI18n();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async (): Promise<void> => {
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

  const aspectRatios: ReadonlyArray<{
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

  const scalingModes: ReadonlyArray<{
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

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card variant="subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Monitor className="w-4 h-4 text-amber-400" />}>
              {t("aspectRatioOption")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              icon={isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              onClick={handleToggleFullscreen}
              className="text-xs h-7 px-2.5 border-amber-600/50 text-amber-300 hover:bg-amber-950/40"
            >
              {isFullscreen ? t("fullscreenExitBtn") : t("fullscreenEnterBtn")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {aspectRatios.map((mode) => (
              <SettingOptionCard
                key={mode.id}
                id={`aspect-ratio-${mode.id}`}
                selected={displaySettings.aspectRatio === mode.id}
                onSelect={() => setDisplaySettings({ aspectRatio: mode.id })}
                icon={mode.icon}
                title={mode.label}
                description={mode.subLabel}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
            {t("scalingOption")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scalingModes.map((mode) => (
              <SettingOptionCard
                key={mode.id}
                id={`scaling-filter-${mode.id}`}
                selected={displaySettings.scalingFilter === mode.id}
                onSelect={() => setDisplaySettings({ scalingFilter: mode.id })}
                title={mode.title}
                description={mode.desc}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

