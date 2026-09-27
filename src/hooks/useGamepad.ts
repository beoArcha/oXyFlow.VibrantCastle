import { useState, useEffect, useCallback } from "react";
import { PlayerId, GamepadBindingMap } from "@game/types";
import gameInputs, { ConnectedGamepadInfo } from "@game/loop/input";

export function useGamepad(selectedPlayer: PlayerId) {
  const [connectedPads, setConnectedPads] = useState<ConnectedGamepadInfo[]>([]);
  const [bindings, setBindings] = useState<GamepadBindingMap>(() =>
    gameInputs.getGamepadBindings(selectedPlayer)
  );
  const [listeningAction, setListeningAction] = useState<keyof GamepadBindingMap | null>(null);
  const [lastPressedButton, setLastPressedButton] = useState<number | null>(null);

  const activePadIndex = selectedPlayer === PlayerId.Player1 ? 0 : 1;
  const currentPad = connectedPads.find((p) => p.index === activePadIndex);

  // Poll pads & buttons
  useEffect(() => {
    const updatePads = () => {
      const rawPads = gameInputs.getConnectedGamepads();
      const infos: ConnectedGamepadInfo[] = rawPads.map((p) => ({
        index: p.index,
        id: p.id,
        buttonsCount: p.buttons.length,
        axesCount: p.axes.length,
      }));
      setConnectedPads(infos);

      const pad = rawPads[activePadIndex];
      if (pad) {
        for (let i = 0; i < pad.buttons.length; i++) {
          if (pad.buttons[i].pressed || pad.buttons[i].value > 0.5) {
            setLastPressedButton(i);
            if (listeningAction) {
              gameInputs.setGamepadBinding(selectedPlayer, listeningAction, i);
              setBindings(gameInputs.getGamepadBindings(selectedPlayer));
              setListeningAction(null);
            }
            break;
          }
        }
      }
    };

    const interval = setInterval(updatePads, 100);
    const unsub = gameInputs.onGamepadChange(() => updatePads());

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [selectedPlayer, activePadIndex, listeningAction]);

  useEffect(() => {
    setBindings(gameInputs.getGamepadBindings(selectedPlayer));
    setListeningAction(null);
  }, [selectedPlayer]);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setBindings(gameInputs.getGamepadBindings(selectedPlayer));
    setListeningAction(null);
  }, [selectedPlayer]);

  const bindAction = useCallback((action: keyof GamepadBindingMap, buttonIndex: number) => {
    gameInputs.setGamepadBinding(selectedPlayer, action, buttonIndex);
    setBindings(gameInputs.getGamepadBindings(selectedPlayer));
    setListeningAction(null);
  }, [selectedPlayer]);

  return {
    connectedPads,
    currentPad,
    bindings,
    listeningAction,
    setListeningAction,
    lastPressedButton,
    resetDefaults,
    bindAction,
  };
}
