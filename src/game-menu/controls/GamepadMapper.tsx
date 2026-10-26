import React, { useState } from "react";
import { Gamepad as GamepadIcon, Sparkles } from "lucide-react";
import { PlayerId } from "@game/types";
import { Button, Badge, KbdKey, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useGamepad } from "./hooks/useGamepad";
import { ControlBindingRow } from "./ControlBindingRow";
import { ControlsMapperCard } from "./ControlsMapperCard";
import { cn } from "@lib/utils";
import {
  GamepadMapperProps,
  GAMEPAD_ACTION_I18N_MAP,
  GAMEPAD_ACTION_KEYS,
} from "./types";

export type { GamepadMapperProps };

/**
 * Gamepad controller button mapping configuration panel.
 * Composes ControlsMapperCard, ControlBindingRow, Badge, and KbdKey primitives.
 *
 * @example
 * ```tsx
 * <GamepadMapper />
 * ```
 */
export const GamepadMapper: React.FC<GamepadMapperProps> = React.memo(
  function GamepadMapper({ className }) {
    const { t } = useI18n();
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);

    const {
      currentPad,
      bindings,
      listeningAction,
      setListeningAction,
      lastPressedButton,
      resetDefaults,
    } = useGamepad(selectedPlayer);

    const isP1 = selectedPlayer === PlayerId.Player1;

    const beforeGrid = (
      <>
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
              {t("lastPressedButton")} {t("buttonPrefix")} {lastPressedButton}
            </Badge>
          )}
        </div>

        {listeningAction && (
          <div
            id="gamepad-listening-banner"
            className="p-3 bg-amber-950/90 border-2 border-amber-500 rounded-xl text-center flex flex-col items-center gap-1.5 animate-pulse"
          >
            <Text size="xs" weight="bold" uppercase variant="secondary" className="tracking-wider">
              {t("remapGamepadPrompt")} {t(GAMEPAD_ACTION_I18N_MAP[listeningAction])}
            </Text>
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
      </>
    );

    return (
      <ControlsMapperCard
        title={t("tabGamepad")}
        titleIcon={<GamepadIcon className="w-5 h-5 text-amber-400" />}
        resetBtnId="reset-gamepad-bindings-btn"
        onResetDefaults={resetDefaults}
        selectedPlayer={selectedPlayer}
        onSelectPlayer={setSelectedPlayer}
        gridId="gamepad-bindings-grid"
        beforeGrid={beforeGrid}
        className={className}
      >
        {GAMEPAD_ACTION_KEYS.map((action) => {
          const buttonIndex = bindings[action];
          const actionLabel = t(GAMEPAD_ACTION_I18N_MAP[action]);
          const isListeningThis = listeningAction === action;

          return (
            <ControlBindingRow
              key={`${selectedPlayer}-${action}`}
              id={`gamepad-binding-${selectedPlayer}-${action}`}
              label={actionLabel}
              rebindLabel={isListeningThis ? t("cancel") : t("remapKey")}
              rebindVariant={isListeningThis ? "primary" : "secondary"}
              isListening={isListeningThis}
              disabled={!currentPad && !isListeningThis}
              onRebind={() => setListeningAction(isListeningThis ? null : action)}
            >
              <KbdKey variant={isP1 ? "amber" : "cyan"}>
                {t("buttonPrefix")} {buttonIndex}
              </KbdKey>
            </ControlBindingRow>
          );
        })}
      </ControlsMapperCard>
    );
  }
);

GamepadMapper.displayName = "GamepadMapper";

export default GamepadMapper;
