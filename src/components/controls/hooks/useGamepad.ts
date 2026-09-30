import { useState, useEffect, useCallback, useMemo } from "react";
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

  // Event-driven gamepad connection updates and disconnect safeguard
  useEffect(() => {
    setConnectedPads(getConnectedPadInfos());
    const unsub = gameInputs.onGamepadChange((connected, pad) => {
      setConnectedPads(getConnectedPadInfos());
      // Automatically cancel remapping if active gamepad was disconnected
      if (!connected && pad.index === activePadIndex) {
        setListeningAction(null);
      }
    });
    return unsub;
  }, [activePadIndex]);

  // Synchronize bindings when player changes or when bindings are updated externally
  useEffect(() => {
    setBindings({ ...gameInputs.getGamepadBindings(selectedPlayer) });
    setListeningAction(null);

    const unsub = gameInputs.onBindingsChange(() => {
      setBindings({ ...gameInputs.getGamepadBindings(selectedPlayer) });
    });
    return unsub;
  }, [selectedPlayer]);

  // Poll button presses ONLY when listening for a rebind action (50ms interval balances latency and CPU)
  useEffect(() => {
    if (!listeningAction) return;

    const interval = setInterval(() => {
      const rawPads = gameInputs.getConnectedGamepads();
      const pad = rawPads[activePadIndex];
      // If controller disconnected during listening, cancel listening
      if (!pad) {
        setListeningAction(null);
        return;
      }

      for (let i = 0; i < pad.buttons.length; i++) {
        const btn = pad.buttons[i];
        if (!btn) continue;

        // Triggers and standard buttons: register when pressed or analog value crosses threshold
        if (btn.pressed || btn.value > 0.5) {
          setLastPressedButton(i);
          gameInputs.setGamepadBinding(selectedPlayer, listeningAction, i);
          setListeningAction(null);
          break;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [listeningAction, activePadIndex, selectedPlayer]);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setListeningAction(null);
  }, [selectedPlayer]);

  return useMemo(
    () => ({
      connectedPads,
      currentPad,
      bindings,
      listeningAction,
      setListeningAction,
      lastPressedButton,
      resetDefaults,
    }),
    [
      connectedPads,
      currentPad,
      bindings,
      listeningAction,
      lastPressedButton,
      resetDefaults,
    ]
  );
}

export default useGamepad;
