import React, { useState } from "react";
import { Keyboard } from "lucide-react";
import { PlayerId } from "@game/types";
import { KbdGroup } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard } from "./hooks/useKeyboard";
import { formatKeyLabel } from "./formatKeyLabel";
import { ControlBindingRow } from "./ControlBindingRow";
import { ControlsMapperCard } from "./ControlsMapperCard";
import {
  KeyboardMapperProps,
  KEYBOARD_ACTION_I18N_MAP,
  KEYBOARD_ACTION_KEYS,
} from "./types";

export type { KeyboardMapperProps };

/**
 * Keyboard control binding configuration panel.
 * Composes ControlsMapperCard, ControlBindingRow, and KbdGroup primitives.
 */
export const KeyboardMapper: React.FC<KeyboardMapperProps> = React.memo(
  function KeyboardMapper({ onStartRebind, className }) {
    const { t } = useI18n();
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);
    const { bindings, resetDefaults } = useKeyboard(selectedPlayer);

    const isP1 = selectedPlayer === PlayerId.Player1;

    return (
      <ControlsMapperCard
        title={t("tabKeyboard")}
        titleIcon={<Keyboard className="w-5 h-5 text-amber-400" />}
        resetBtnId="reset-keyboard-bindings-btn"
        onResetDefaults={resetDefaults}
        selectedPlayer={selectedPlayer}
        onSelectPlayer={setSelectedPlayer}
        gridId="keyboard-bindings-grid"
        className={className}
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
      </ControlsMapperCard>
    );
  }
);

KeyboardMapper.displayName = "KeyboardMapper";

export default KeyboardMapper;
