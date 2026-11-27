import React, { useState } from "react";
import { Gamepad as GamepadIcon, RotateCcw, Sparkles } from "lucide-react";
import { PlayerId } from "@game/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KbdKey,
  Paragraph,
  Text,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { useGamepad } from "./hooks/useGamepad";
import {
  GAMEPAD_ACTION_KEYS,
  GAMEPAD_ACTION_LABEL_KEYS,
  getGamepadButtonLabelKey,
} from "./gamepadLayout";

export interface GamepadMapperProps {
  readonly className?: string;
}

const PLAYERS: readonly PlayerId[] = [PlayerId.Player1, PlayerId.Player2];

/**
 * Gamepad rebinding card for Settings > Controls, shown beside the keyboard list.
 * Only the restricted pad layout (A/B/X/Y, LB/RB, LT/RT) can be bound.
 *
 * @example
 * ```tsx
 * <GamepadMapper />
 * ```
 */
export const GamepadMapper: React.FC<GamepadMapperProps> = React.memo(function GamepadMapper({
  className,
}) {
  const { t } = useI18n();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);

  const {
    currentPad,
    bindings,
    listeningAction,
    setListeningAction,
    lastPressedButton,
    rejectedButton,
    resetDefaults,
  } = useGamepad(selectedPlayer);

  const isP1 = selectedPlayer === PlayerId.Player1;
  const describeButton = (buttonIndex: number): string => {
    const labelKey = getGamepadButtonLabelKey(buttonIndex);
    return labelKey ? `${t("buttonPrefix")} ${t(labelKey)}` : `${t("buttonPrefix")} ${buttonIndex}`;
  };

  return (
    <Card variant="subtle" className={className ?? "w-full"}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle icon={<GamepadIcon className="w-5 h-5 text-amber-400" />}>
            {t("tabGamepad")}
          </CardTitle>
          <Button
            id="reset-gamepad-bindings-btn"
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={12} />}
            onClick={resetDefaults}
          >
            {t("resetDefaultBindings")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        <div className="flex flex-wrap gap-2" role="group">
          {PLAYERS.map((player) => (
            <Button
              key={player}
              size="sm"
              variant={player === selectedPlayer ? "primary" : "secondary"}
              aria-pressed={player === selectedPlayer}
              onClick={() => setSelectedPlayer(player)}
            >
              {player === PlayerId.Player1 ? t("p1Status") : t("p2Status")}
            </Button>
          ))}
        </div>

        <Paragraph size="2xs" variant="muted">
          {t("gamepadLayoutHint")}
        </Paragraph>

        <div
          id="gamepad-status-card"
          className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <GamepadIcon
              className={cn("w-4 h-4", currentPad ? "text-emerald-400" : "text-stone-600")}
            />
            <Text size="xs" weight="semibold" className="text-stone-200">
              {currentPad
                ? `${t("gamepadConnected")} (${currentPad.id.slice(0, 24)}...)`
                : t("noGamepadDetected")}
            </Text>
          </div>

          {lastPressedButton !== null && (
            <Badge variant="amber" icon={<Sparkles size={11} />}>
              {t("lastPressedButton")} {describeButton(lastPressedButton)}
            </Badge>
          )}
        </div>

        {listeningAction !== null && (
          <div
            id="gamepad-listening-banner"
            className="p-3 bg-amber-950/90 border-2 border-amber-500 rounded-xl text-center flex flex-col items-center gap-1.5 animate-pulse"
          >
            <Text size="xs" weight="bold" uppercase variant="secondary" className="tracking-wider">
              {t("remapGamepadPrompt")} {t(GAMEPAD_ACTION_LABEL_KEYS[listeningAction])}
            </Text>
            {rejectedButton !== null && (
              <Text size="xs" variant="secondary" role="alert">
                {t("gamepadButtonNotBindable")}
              </Text>
            )}
            <Button
              id="cancel-gamepad-rebind-btn"
              size="sm"
              variant="secondary"
              onClick={() => setListeningAction(null)}
            >
              {t("cancel")}
            </Button>
          </div>
        )}

        <div
          id="gamepad-bindings-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1"
        >
          {GAMEPAD_ACTION_KEYS.map((action) => {
            const isListeningThis = listeningAction === action;
            return (
              <div
                key={`${selectedPlayer}-${action}`}
                id={`gamepad-binding-${selectedPlayer}-${action}`}
                className="flex items-center justify-between gap-2 text-xs py-0.5"
              >
                <Text size="xs" className="text-stone-200">
                  {t(GAMEPAD_ACTION_LABEL_KEYS[action])}
                </Text>
                <div className="flex items-center gap-2 shrink-0">
                  <KbdKey variant={isP1 ? "amber" : "cyan"}>
                    {describeButton(bindings[action])}
                  </KbdKey>
                  <Button
                    size="sm"
                    variant={isListeningThis ? "primary" : "secondary"}
                    disabled={!currentPad && !isListeningThis}
                    onClick={() => setListeningAction(isListeningThis ? null : action)}
                  >
                    {isListeningThis ? t("cancel") : t("remapKey")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

GamepadMapper.displayName = "GamepadMapper";

export default GamepadMapper;
