import React, { useState, useCallback } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { PlayerId, InputMap, GameTranslationDictionary } from "@game/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmDialog,
  KbdKey,
} from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard } from "./hooks/useKeyboard";
import { formatKeyLabel } from "./formatKeyLabel";
import { ControlBindingRow } from "./ControlBindingRow";
import { PlayerTabSelector } from "./PlayerTabSelector";

export interface KeyboardMapperProps {
  /** Callback fired to begin key rebind for an action */
  onStartRebind: (action: keyof InputMap, player: PlayerId, label: string) => void;
  /** Optional container class name */
  className?: string;
}

const ACTION_I18N_KEYS: Record<keyof InputMap, keyof GameTranslationDictionary> = {
  left: "keyMoveLeft",
  right: "keyMoveRight",
  up: "keyAimUp",
  down: "keyCrouchDown",
  jump: "keyJump",
  action1: "keyMeleeAttack",
  action2: "keyDashAction",
  magic1: "keyPrimaryMagic",
  magic2: "keySecondaryMagic",
  potion1: "keyPotion1",
  potion2: "keyPotion2",
  potion3: "keyPotion3",
};

const ACTION_KEYS = Object.keys(ACTION_I18N_KEYS) as (keyof InputMap)[];

/**
 * Keyboard control binding configuration panel.
 * Composes PlayerTabSelector, ControlBindingRow, and ConfirmDialog primitives.
 *
 * @example
 * ```tsx
 * <KeyboardMapper onStartRebind={handleStartRebind} />
 * ```
 */
export const KeyboardMapper: React.FC<KeyboardMapperProps> = React.memo(
  function KeyboardMapper({ onStartRebind, className }) {
    const { t } = useI18n();
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
    const { bindings, resetDefaults } = useKeyboard(selectedPlayer);

    const isP1 = selectedPlayer === PlayerId.Player1;

    const handleConfirmReset = useCallback(() => {
      resetDefaults();
      setIsConfirmResetOpen(false);
    }, [resetDefaults]);

    return (
      <Card variant="subtle" className={className ?? "w-full"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Keyboard className="w-5 h-5 text-amber-400" />}>
              {t("tabKeyboard")}
            </CardTitle>
            <Button
              id="reset-keyboard-bindings-btn"
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
          {/* Player Tabs */}
          <PlayerTabSelector
            selectedPlayer={selectedPlayer}
            onSelectPlayer={setSelectedPlayer}
          />

          {/* Bindings List */}
          <div
            id="keyboard-bindings-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1"
          >
            {ACTION_KEYS.map((action) => {
              const keys = bindings[action] || [];
              const actionLabel = t(ACTION_I18N_KEYS[action]);

              return (
                <ControlBindingRow
                  key={`${selectedPlayer}-${action}`}
                  id={`key-binding-${selectedPlayer}-${action}`}
                  label={actionLabel}
                  rebindLabel={t("remapKey")}
                  onRebind={() => onStartRebind(action, selectedPlayer, actionLabel)}
                >
                  {keys.slice(0, 2).map((k) => (
                    <KbdKey key={k} variant={isP1 ? "amber" : "cyan"}>
                      {formatKeyLabel(k, t("spaceKey"))}
                    </KbdKey>
                  ))}
                </ControlBindingRow>
              );
            })}
          </div>
        </CardContent>

        {/* Reset Confirmation Dialog */}
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

KeyboardMapper.displayName = "KeyboardMapper";

export default KeyboardMapper;
