import React, { useCallback } from "react";
import { Languages } from "lucide-react";
import { Card, CardContent, Paragraph, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useSettings } from "@context/SettingsContext";
import { useGameEngine } from "@context/GameEngineContext";
import { LanguageSelector } from "@game-menu/common";
import { GameHudSection, GameConfigBarSection } from "./gameplay";
import { cn } from "@lib/utils";

export interface InterfaceTabProps {
  readonly className?: string;
}

/**
 * Settings > Interfejs (Interface) tab: language selector, HUD toggles, and settings backup/reset.
 */
export const InterfaceTab = ({ className }: InterfaceTabProps = {}): React.ReactElement => {
  const { t } = useI18n();
  const {
    hudSettings,
    setHudSettings,
    exportSettingsToFile,
    importSettingsFromFile,
    resetToDefaults: resetSettingsToDefaults,
  } = useSettings();
  const { setPlayerCharacter } = useGameEngine();

  const handleResetDefaults = useCallback(() => {
    resetSettingsToDefaults();
    setPlayerCharacter(0, "valen");
  }, [resetSettingsToDefaults, setPlayerCharacter]);

  return (
    <div
      id="tab-content-interface"
      className={cn("flex flex-col gap-5 animate-in fade-in duration-150", className)}
    >
      <Card variant="subtle">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-start gap-2.5">
            <Languages className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <Text size="xs" weight="bold" variant="amber" className="block">
                {t("interfaceLanguageTitle")}
              </Text>
              <Paragraph size="2xs" variant="muted">
                {t("interfaceLanguageDesc")}
              </Paragraph>
            </div>
          </div>
          <LanguageSelector variant="pills" />
        </CardContent>
      </Card>

      <GameHudSection
        hudSettings={hudSettings}
        onToggleRpgButtons={() =>
          setHudSettings({ showRpgButtons: !hudSettings.showRpgButtons })
        }
        onToggleControlsHint={() =>
          setHudSettings({ showControlsHint: !hudSettings.showControlsHint })
        }
        onToggleNarratorSubtitles={() =>
          setHudSettings({ showNarratorSubtitles: !hudSettings.showNarratorSubtitles })
        }
      />

      <GameConfigBarSection
        onExportSettings={exportSettingsToFile}
        onImportSettings={importSettingsFromFile}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};

export default InterfaceTab;
