import React from "react";
import { Layout, Backpack, HelpCircle, Subtitles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, SettingToggleRow } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import type { HudSettings } from "@context/settingsTypes";
import { cn } from "@lib/utils";

export interface GameHudSectionProps {
  readonly hudSettings: HudSettings;
  readonly onToggleRpgButtons: () => void;
  readonly onToggleControlsHint: () => void;
  readonly onToggleNarratorSubtitles: () => void;
  readonly className?: string;
}

export const GameHudSection = ({
  hudSettings,
  onToggleRpgButtons,
  onToggleControlsHint,
  onToggleNarratorSubtitles,
  className,
}: GameHudSectionProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Card variant="subtle" className={cn(className)}>
      <CardHeader>
        <CardTitle icon={<Layout className="w-4 h-4 text-amber-400" />}>
          {t("hudInterfaceTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <SettingToggleRow
          id="hud-rpg-buttons"
          icon={<Backpack size={16} />}
          title={t("hudRpgButtonsTitle")}
          description={t("hudRpgButtonsDesc")}
          checked={hudSettings.showRpgButtons}
          onCheckedChange={onToggleRpgButtons}
        />
        <SettingToggleRow
          id="hud-controls-hint"
          icon={<HelpCircle size={16} />}
          title={t("hudHotkeyHintsTitle")}
          description={t("hudHotkeyHintsDesc")}
          checked={hudSettings.showControlsHint}
          onCheckedChange={onToggleControlsHint}
        />
        <SettingToggleRow
          id="hud-narrator-subtitles"
          icon={<Subtitles size={16} />}
          title={t("hudNarratorSubtitlesTitle")}
          description={t("hudNarratorSubtitlesDesc")}
          checked={hudSettings.showNarratorSubtitles}
          onCheckedChange={onToggleNarratorSubtitles}
        />
      </CardContent>
    </Card>
  );
};
