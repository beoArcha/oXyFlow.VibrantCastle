import React, { useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { Button } from "@ui";
import { useSettings } from "@context/SettingsContext";
import { useI18n } from "@context/I18nContext";
import { useSafeTimeout } from "@context/hooks/useSafeTimeout";
import { DEFAULT_SETTINGS } from "@context/settingsTypes";
import { DisplaySettingsSection } from "./DisplaySettingsSection";
import { CharacterStudioSection } from "./CharacterStudioSection";
import { cn } from "@lib/utils";

export interface DisplayTabProps {
  readonly className?: string;
}

export const DisplayTab = ({ className }: DisplayTabProps = {}): React.ReactElement => {
  const { setDisplaySettings } = useSettings();
  const { t } = useI18n();
  const { setSafeTimeout } = useSafeTimeout();
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const showNotification = (msg: string): void => {
    setStatusNotification(msg);
    setSafeTimeout(() => setStatusNotification(null), 2500);
  };

  const handleResetDisplay = (): void => {
    setDisplaySettings({
      aspectRatio: DEFAULT_SETTINGS.display.aspectRatio,
      scalingFilter: DEFAULT_SETTINGS.display.scalingFilter,
      assetQuality: DEFAULT_SETTINGS.display.assetQuality,
      targetFps: DEFAULT_SETTINGS.display.targetFps,
      showFpsCounter: DEFAULT_SETTINGS.display.showFpsCounter,
    });
    showNotification(t("displayResetNotification"));
  };

  return (
    <div
      id="tab-content-display"
      className={cn("flex flex-col gap-4 animate-in fade-in duration-150 text-stone-200", className)}
    >
      {statusNotification && (
        <div className="p-2.5 bg-amber-600/90 text-white rounded-xl shadow-lg border border-amber-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{statusNotification}</span>
          <Check size={14} />
        </div>
      )}

      <DisplaySettingsSection />

      <CharacterStudioSection />

      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#140602] border border-[#5c2d18] rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-amber-400">{t("displayResetTitle")}</p>
            <p className="text-[11px] text-stone-400">
              {t("displayResetDesc")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={13} />}
          onClick={handleResetDisplay}
        >
          {t("displayResetDefaultsBtn")}
        </Button>
      </div>
    </div>
  );
};

export default DisplayTab;
