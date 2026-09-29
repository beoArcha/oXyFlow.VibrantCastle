import React, { useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { PlayerId, InputMap, GameTranslationDictionary } from "@game/types";
import { Button, Card, CardHeader, CardTitle, CardContent, KbdKey } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { useKeyboard } from "./hooks/useKeyboard";
import { formatKeyLabel } from "./formatKeyLabel";
import { cn } from "@lib/utils";

export interface KeyboardMapperProps {
  onStartRebind: (action: keyof InputMap, player: PlayerId, label: string) => void;
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

export const KeyboardMapper: React.FC<KeyboardMapperProps> = ({ onStartRebind }) => {
  const { t } = useI18n();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);
  const { bindings, resetDefaults } = useKeyboard(selectedPlayer);

  const isP1 = selectedPlayer === PlayerId.Player1;

  return (
    <Card variant="subtle" className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle icon={<Keyboard className="w-5 h-5 text-amber-400" />}>
            {t("tabKeyboard")}
          </CardTitle>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={12} />} onClick={resetDefaults}>
            {t("resetDefaultBindings")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        {/* Player Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPlayer(PlayerId.Player1)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
              isP1
                ? "bg-amber-700 text-white shadow-md border border-amber-500"
                : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-transparent"
            )}
          >
            {t("p1Tag")}
          </button>
          <button
            onClick={() => setSelectedPlayer(PlayerId.Player2)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
              !isP1
                ? "bg-cyan-800 text-white shadow-md border border-cyan-500"
                : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-transparent"
            )}
          >
            {t("p2Tag")}
          </button>
        </div>

        {/* Bindings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {ACTION_KEYS.map((action) => {
            const keys = bindings[action] || [];
            const actionLabel = t(ACTION_I18N_KEYS[action]);

            return (
              <div
                key={`${selectedPlayer}-${action}`}
                className="p-2.5 rounded-lg bg-[#1c0c07] border border-[#4a200e] hover:border-[#8d4325] flex items-center justify-between transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#fed7aa]">{actionLabel}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {keys.slice(0, 2).map((k) => (
                      <KbdKey key={k} variant={isP1 ? "amber" : "cyan"}>
                        {formatKeyLabel(k, t("spaceKey"))}
                      </KbdKey>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onStartRebind(action, selectedPlayer, actionLabel)}
                >
                  {t("remapKey")}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyboardMapper;
