import React, { useState, useCallback } from "react";
import { Gamepad as GamepadIcon, RotateCcw, Sparkles } from "lucide-react";
import { PlayerId, GamepadBindingMap, GameTranslationDictionary } from "@game/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmDialog,
  Badge,
  KbdKey,
} from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useGamepad } from "./hooks/useGamepad";
import { ControlBindingRow } from "./ControlBindingRow";
import { PlayerTabSelector } from "./PlayerTabSelector";
import { cn } from "@lib/utils";

export interface GamepadMapperProps {
  /** Optional container class name */
  className?: string;
}

const ACTION_I18N_KEYS: Record<keyof GamepadBindingMap, keyof GameTranslationDictionary> = {
  jump: "keyJump",
  action1: "keyMeleeAttack",
  action2: "keyDashAction",
  magic1: "keyPrimaryMagic",
  magic2: "keySecondaryMagic",
  potion1: "keyPotion1",
  potion2: "keyPotion2",
  potion3: "keyPotion3",
};

const ACTION_KEYS = Object.keys(ACTION_I18N_KEYS) as (keyof GamepadBindingMap)[];

/**
 * Gamepad controller button mapping configuration panel.
 * Composes PlayerTabSelector, ControlBindingRow, and ConfirmDialog primitives.
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
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

    const {
      currentPad,
      bindings,
      listeningAction,
      setListeningAction,
      lastPressedButton,
      resetDefaults,
    } = useGamepad(selectedPlayer);

    const isP1 = selectedPlayer === PlayerId.Player1;

    const handleConfirmReset = useCallback(() => {
      resetDefaults();
      setIsConfirmResetOpen(false);
    }, [resetDefaults]);

    return (
      <Card variant="subtle" className={className ?? "w-full"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<GamepadIcon className="w-5 h-5 text-amber-400" />}>
              {t("tabGamepad")}
            </CardTitle>
            <Button
              id="reset-gamepad-bindings-btn"
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={12} />}
              onClick={() => setIsConfirmResetOpen(true)}
            >
              {t("resetDefaultBindings")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          <PlayerTabSelector
            selectedPlayer={selectedPlayer}
            onSelectPlayer={setSelectedPlayer}
          />

          <div
            id="gamepad-status-card"
            className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <GamepadIcon
                className={cn("w-4 h-4", currentPad ? "text-emerald-400" : "text-stone-600")}
              />
              <span className="text-xs font-semibold text-stone-200">
                {currentPad
                  ? `${t("gamepadConnected")} (${currentPad.id.slice(0, 24)}...)`
                  : t("noGamepadDetected")}
              </span>
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
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                {t("remapGamepadPrompt")} {t(ACTION_I18N_KEYS[listeningAction])}
              </span>
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
            {ACTION_KEYS.map((action) => {
              const buttonIndex = bindings[action];
              const actionLabel = t(ACTION_I18N_KEYS[action]);
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
          </div>
        </CardContent>

        <ConfirmDialog
          isOpen={isConfirmResetOpen}
          onClose={() => setIsConfirmResetOpen(false)}
          onConfirm={handleConfirmReset}
          title={t("confirmResetControls")}
          message={t("confirmResetControlsPrompt")}
          confirmLabel={t("resetDefaultBindings")}
          cancelLabel={t("cancel")}
          confirmVariant="danger"
        />
      </Card>
    );
  }
);

GamepadMapper.displayName = "GamepadMapper";

export default GamepadMapper;
