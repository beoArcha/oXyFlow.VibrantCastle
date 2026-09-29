import { useState, useEffect, useCallback } from "react";
import { PlayerId, GamepadBindingMap } from "@game/types";
import gameInputs, { ConnectedGamepadInfo } from "@game/loop/input";

export interface UseGamepadResult {
  connectedPads: ConnectedGamepadInfo[];
  currentPad: ConnectedGamepadInfo | undefined;
  bindings: GamepadBindingMap;
  listeningAction: keyof GamepadBindingMap | null;
  setListeningAction: React.Dispatch<React.SetStateAction<keyof GamepadBindingMap | null>>;
  lastPressedButton: number | null;
  resetDefaults: () => void;
}

function getConnectedPadInfos(): ConnectedGamepadInfo[] {
  return gameInputs.getConnectedGamepads().map((p) => ({
    index: p.index,
    id: p.id,
    buttonsCount: p.buttons.length,
    axesCount: p.axes.length,
  }));
}

/**
 * Custom React hook for gamepad controller management, connection tracking, and rebinding.
 * Uses event-driven connection updates and on-demand polling only during remapping.
 */
export function useGamepad(selectedPlayer: PlayerId): UseGamepadResult {
  const [connectedPads, setConnectedPads] = useState<ConnectedGamepadInfo[]>(getConnectedPadInfos);
  const [bindings, setBindings] = useState<GamepadBindingMap>(() => ({
    ...gameInputs.getGamepadBindings(selectedPlayer),
  }));
  const [listeningAction, setListeningAction] = useState<keyof GamepadBindingMap | null>(null);
  const [lastPressedButton, setLastPressedButton] = useState<number | null>(null);

  const activePadIndex = selectedPlayer === PlayerId.Player1 ? 0 : 1;
  const currentPad = connectedPads.find((p) => p.index === activePadIndex);

  // Event-driven gamepad connection updates (zero idle polling overhead)
  useEffect(() => {
    setConnectedPads(getConnectedPadInfos());
    const unsub = gameInputs.onGamepadChange(() => {
      setConnectedPads(getConnectedPadInfos());
    });
    return unsub;
  }, []);

  // Synchronize bindings when player changes
  useEffect(() => {
    setBindings({ ...gameInputs.getGamepadBindings(selectedPlayer) });
    setListeningAction(null);
  }, [selectedPlayer]);

  // Poll button presses ONLY when listening for a rebind action
  useEffect(() => {
    if (!listeningAction) return;

    const interval = setInterval(() => {
      const rawPads = gameInputs.getConnectedGamepads();
      const pad = rawPads[activePadIndex];
      if (!pad) return;

      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i].pressed || pad.buttons[i].value > 0.5) {
          setLastPressedButton(i);
          gameInputs.setGamepadBinding(selectedPlayer, listeningAction, i);
          setBindings({ ...gameInputs.getGamepadBindings(selectedPlayer) });
          setListeningAction(null);
          break;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [listeningAction, activePadIndex, selectedPlayer]);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setBindings({ ...gameInputs.getGamepadBindings(selectedPlayer) });
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
  };
}
