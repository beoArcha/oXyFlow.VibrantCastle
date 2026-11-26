import React from "react";
import { Keyboard, Compass, Swords, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Text, Paragraph, Code } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useControls } from "@context/ControlsContext";
import { useSettings } from "@context/SettingsContext";
import { formatKeyLabel } from "@game-menu/controls";
import { MODAL_REGISTRY } from "@game-menu/modal/modalRegistry";
import { BINDABLE_ACTION_CATALOG } from "./ControlsMenuTab";

/**
 * Full Guidebook & Help modal view displaying live P1/P2 keybindings from ControlsContext,
 * directional combat mechanics, and registry-driven global shortcuts.
 */
export const HelpModalView: React.FC = () => {
  const { t } = useI18n();
  const { p1Keyboard, p2Keyboard } = useControls();
  const { isTwoPlayer } = useSettings();

  return (
    <div className="flex flex-col gap-4">
      {/* Live Keybindings Table */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard size={15} className="text-amber-400" />
            {t("controlsHelp")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Text size="xs" weight="bold" className="text-amber-300 pb-1 border-b border-stone-800">
              {t("p1Status")}
            </Text>
            {BINDABLE_ACTION_CATALOG.map(({ action, labelKey }) => (
              <div
                key={`p1_${action}`}
                className="flex items-center justify-between gap-2 text-xs py-0.5"
              >
                <Text size="xs" className="text-stone-300">
                  {t(labelKey)}
                </Text>
                <Code size="xs">
                  {formatKeyLabel(p1Keyboard[action]?.[0] ?? "", t("spaceKey"))}
                </Code>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800">
              <Text size="xs" weight="bold" className="text-cyan-300">
                {t("p2Status")}
              </Text>
              <Badge variant={isTwoPlayer ? "green" : "stone"}>
                {isTwoPlayer ? "2P Active" : "Co-op Ready"}
              </Badge>
            </div>
            {BINDABLE_ACTION_CATALOG.map(({ action, labelKey }) => (
              <div
                key={`p2_${action}`}
                className="flex items-center justify-between gap-2 text-xs py-0.5"
              >
                <Text size="xs" className="text-stone-300">
                  {t(labelKey)}
                </Text>
                <Code size="xs">
                  {formatKeyLabel(p2Keyboard[action]?.[0] ?? "", t("spaceKey"))}
                </Code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Combat, Directional Aiming & Dash Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords size={15} className="text-amber-400" />
              {t("crouchAimTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Paragraph size="xs">{t("slideDescription")}</Paragraph>
            <Paragraph size="xs">{t("backstepDescription")}</Paragraph>
            <Text size="xs" weight="bold" className="text-amber-300 pt-1">
              {t("directionalAimingTitle")}
            </Text>
            <Paragraph size="2xs" variant="muted">{t("aimStraightUp")}</Paragraph>
            <Paragraph size="2xs" variant="muted">{t("aim45Up")}</Paragraph>
            <Paragraph size="2xs" variant="muted">{t("aim45Down")}</Paragraph>
            <Paragraph size="2xs" variant="muted">{t("aimStraightDown")}</Paragraph>
          </CardContent>
        </Card>

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
            Skróty Interfejsu (Live vs Pauza)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MODAL_REGISTRY.map((def) => (
            <div
              key={def.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-stone-800"
            >
              <Code size="xs">[{def.navigationTab.keyLabel}]</Code>
              <Text size="xs">{t(def.navigationTab.labelKey)}</Text>
              <Badge variant={def.pausesGame ? "amber" : "green"}>
                {def.pausesGame ? "Pauza" : "Live"}
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
