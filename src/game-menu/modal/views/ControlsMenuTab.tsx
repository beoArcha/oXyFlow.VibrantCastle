import React from "react";
import { RotateCcw, Keyboard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Text, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useControls } from "@context/ControlsContext";
import { formatKeyLabel } from "@game-menu/controls";
import { GamepadMapper } from "@game-menu/controls/GamepadMapper";
import { InputMap, PlayerId } from "@game/types";

export interface ControlsMenuTabProps {
  readonly onStartRebind: (
    action: keyof InputMap,
    player: PlayerId,
    label: string
  ) => void;
}

export const BINDABLE_ACTION_CATALOG: readonly {
  readonly action: keyof InputMap;
  readonly labelKey: string;
}[] = [
  { action: "left", labelKey: "keyMoveLeft" },
  { action: "right", labelKey: "keyMoveRight" },
  { action: "up", labelKey: "keyAimUp" },
  { action: "down", labelKey: "keyCrouchDown" },
  { action: "jump", labelKey: "keyJump" },
  { action: "action1", labelKey: "keyMeleeAttack" },
  { action: "action2", labelKey: "keyDashAction" },
  { action: "magic1", labelKey: "keyPrimaryMagic" },
  { action: "magic2", labelKey: "keySecondaryMagic" },
  { action: "potion1", labelKey: "keyPotion1" },
  { action: "potion2", labelKey: "keyPotion2" },
  { action: "potion3", labelKey: "keyPotion3" },
];

/**
 * Menu Controls tab with distinct localized action names for P1 & P2 keyboard bindings.
 */
export const ControlsMenuTab: React.FC<ControlsMenuTabProps> = ({ onStartRebind }) => {
  const { t } = useI18n();
  const { p1Keyboard, p2Keyboard, resetBindings } = useControls();

  const playerGroups = [
    {
      player: PlayerId.Player1,
      title: t("p1Status"),
      bindings: p1Keyboard,
    },
    {
      player: PlayerId.Player2,
      title: t("p2Status"),
      bindings: p2Keyboard,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Keyboard size={16} className="text-amber-400" />
          <Text weight="bold" size="sm" className="text-amber-300">
            {t("controlsHelp")}
          </Text>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={13} />}
          onClick={() => resetBindings()}
          className="whitespace-nowrap shrink-0"
        >
          {t("resetDefaultBindings")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playerGroups.map(({ player, title, bindings }) => (
          <Card key={player} variant="subtle">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {BINDABLE_ACTION_CATALOG.map(({ action, labelKey }) => {
                const primaryCode = bindings[action]?.[0] ?? "";
                const actionLabel = t(labelKey);
                return (
                  <div
                    key={action}
                    className="flex items-center justify-between gap-2 text-xs py-0.5"
                  >
                    <Text size="xs" className="text-stone-200">
                      {actionLabel}
                    </Text>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onStartRebind(action, player, actionLabel)}
                      className="min-w-[76px] font-mono whitespace-nowrap shrink-0"
                    >
                      {formatKeyLabel(primaryCode, t("spaceKey"))}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <GamepadMapper />

      <Card variant="subtle">
        <CardHeader>
          <CardTitle>{t("crouchAimTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Paragraph size="2xs" variant="muted">
            {t("slideDescription")}
          </Paragraph>
          <Paragraph size="2xs" variant="muted">
            {t("backstepDescription")}
          </Paragraph>
          <Paragraph size="2xs" variant="muted">
            {t("aimStraightUp")}
          </Paragraph>
          <Paragraph size="2xs" variant="muted">
            {t("aim45Up")}
          </Paragraph>
        </CardContent>
      </Card>
    </div>
  );
};

ControlsMenuTab.displayName = "ControlsMenuTab";
export default ControlsMenuTab;
