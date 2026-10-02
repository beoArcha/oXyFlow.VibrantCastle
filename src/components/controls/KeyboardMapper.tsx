import React, { useState, useCallback } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { PlayerId, InputMap } from "@game/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmDialog,
  KbdGroup,
} from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard } from "./hooks/useKeyboard";
import { formatKeyLabel } from "./formatKeyLabel";
import { ControlBindingRow } from "./ControlBindingRow";
import { PlayerTabSelector } from "./PlayerTabSelector";
import {
  KeyboardMapperProps,
  KEYBOARD_ACTION_I18N_MAP,
  KEYBOARD_ACTION_KEYS,
} from "./types";

export type { KeyboardMapperProps };

/**
 * Keyboard control binding configuration panel.
 * Composes PlayerTabSelector, ControlBindingRow, KbdGroup, and ConfirmDialog primitives.
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
          <PlayerTabSelector
            selectedPlayer={selectedPlayer}
            onSelectPlayer={setSelectedPlayer}
          />

          <div
            id="keyboard-bindings-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1"
          >
            {KEYBOARD_ACTION_KEYS.map((action) => {
              const keys = bindings[action] || [];
              const actionLabel = t(KEYBOARD_ACTION_I18N_MAP[action]);

              return (
                <ControlBindingRow
                  key={`${selectedPlayer}-${action}`}
                  id={`key-binding-${selectedPlayer}-${action}`}
                  label={actionLabel}
                  rebindLabel={t("remapKey")}
                  onRebind={() => onStartRebind(action, selectedPlayer, actionLabel)}
                >
                  <KbdGroup
                    keys={keys}
                    maxKeys={2}
                    variant={isP1 ? "amber" : "cyan"}
                    formatLabel={(k) => formatKeyLabel(k, t("spaceKey"))}
                  />
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

KeyboardMapper.displayName = "KeyboardMapper";

export default KeyboardMapper;
