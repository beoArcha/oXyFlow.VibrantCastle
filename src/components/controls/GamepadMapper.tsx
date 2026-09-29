import React, { useState } from "react";
import { Gamepad as GamepadIcon, RotateCcw, Check, Sparkles } from "lucide-react";
import { PlayerId, GamepadBindingMap, GameTranslationDictionary } from "@game/types";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, KbdKey } from "../ui";
import { useI18n } from "@context/I18nContext";
import { useGamepad } from "./hooks/useGamepad";
import { cn } from "@lib/utils";

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

export const GamepadMapper: React.FC = () => {
  const { t } = useI18n();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(PlayerId.Player1);

  const {
    connectedPads,
    currentPad,
    bindings,
    listeningAction,
    setListeningAction,
    lastPressedButton,
    resetDefaults,
  } = useGamepad(selectedPlayer);

  const isP1 = selectedPlayer === PlayerId.Player1;

  return (
    <Card variant="subtle" className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle icon={<GamepadIcon className="w-5 h-5 text-amber-400" />}>
            {t("tabGamepad")}
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

        {/* Status of Gamepad */}
        <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GamepadIcon className={cn("w-4 h-4", currentPad ? "text-emerald-400" : "text-stone-600")} />
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

        {/* Listening Rebind Overlay Banner */}
        {listeningAction && (
          <div className="p-3 bg-amber-950/90 border-2 border-amber-500 rounded-xl text-center flex flex-col items-center gap-1.5 animate-pulse">
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
              {t("remapGamepadPrompt")} {t(ACTION_I18N_KEYS[listeningAction])}
            </span>
            <Button size="sm" variant="secondary" onClick={() => setListeningAction(null)}>
              {t("cancel")}
            </Button>
          </div>
        )}

        {/* Gamepad Bindings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {ACTION_KEYS.map((action) => {
            const buttonIndex = bindings[action];
            const actionLabel = t(ACTION_I18N_KEYS[action]);
            const isListeningThis = listeningAction === action;

            return (
              <div
                key={`${selectedPlayer}-${action}`}
                className={cn(
                  "p-2.5 rounded-lg bg-[#1c0c07] border transition-colors flex items-center justify-between",
                  isListeningThis
                    ? "border-amber-400 bg-amber-950/40 ring-1 ring-amber-400/50"
                    : "border-[#4a200e] hover:border-[#8d4325]"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#fed7aa]">{actionLabel}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <KbdKey variant={isP1 ? "amber" : "cyan"}>
                      {t("buttonPrefix")} {buttonIndex}
                    </KbdKey>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isListeningThis ? "primary" : "secondary"}
                  icon={isListeningThis ? <Check size={12} /> : undefined}
                  onClick={() => setListeningAction(isListeningThis ? null : action)}
                >
                  {isListeningThis ? t("cancel") : t("remapKey")}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GamepadMapper;
