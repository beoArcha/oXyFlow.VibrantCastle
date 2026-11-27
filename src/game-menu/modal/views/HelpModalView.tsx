import React from "react";
import { Keyboard, Compass, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Text,
  Paragraph,
  Code,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { MODAL_REGISTRY } from "@game-menu/modal/modalRegistry";
import { GameCombatTipsSection } from "@game-menu/menu/tabs/gameplay";

export interface HelpModalViewProps {
  readonly onOpenControls?: () => void;
}

/**
 * Full Guidebook & Help modal view displaying directional combat tips,
 * mechanics guide, a deep link to Settings > Controls, and registry-driven global shortcuts.
 */
export const HelpModalView: React.FC<HelpModalViewProps> = ({ onOpenControls }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      {/* Controls deep link (no duplicated keybinding table) */}
      <Card variant="subtle">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-start gap-2.5">
            <Keyboard size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <Text size="xs" weight="bold" variant="amber" className="block">
                {t("controlsHelp")}
              </Text>
              <Paragraph size="2xs" variant="muted">
                {t("helpControlsCardDesc")}
              </Paragraph>
            </div>
          </div>
          {onOpenControls && (
            <Button
              id="help-open-controls-btn"
              size="sm"
              variant="secondary"
              icon={<Keyboard size={13} />}
              onClick={onOpenControls}
            >
              {t("openControlsBtn")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Combat, Directional Aiming & Mechanics Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GameCombatTipsSection />

        <Card variant="subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass size={15} className="text-emerald-400" />
              {t("tipsMechanics")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Paragraph size="xs">{t("tipsTextMove")}</Paragraph>
            <Paragraph size="xs">{t("tipsTextCombat")}</Paragraph>
            <Paragraph size="xs">{t("tipsTextObjectives")}</Paragraph>
            <Paragraph size="xs">{t("tipsTextLiveScreens")}</Paragraph>
          </CardContent>
        </Card>
      </div>

      {/* Registry-driven Global Overlay Shortcuts */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={15} className="text-purple-400" />
            {t("interfaceShortcutsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MODAL_REGISTRY.filter(
            (def) => def.dialog === "game" && Boolean(def.navigationTab.keyLabel)
          ).map((def) => (
            <div
              key={def.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-stone-800"
            >
              <Code size="xs">[{def.navigationTab.keyLabel}]</Code>
              <Text size="xs">{t(def.navigationTab.labelKey)}</Text>
              <Badge variant={def.pausesGame ? "amber" : "green"}>
                {def.pausesGame ? t("pause") : t("liveBadge")}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

HelpModalView.displayName = "HelpModalView";
export default HelpModalView;
