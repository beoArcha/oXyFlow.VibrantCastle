import { useState, useEffect, useCallback, useMemo } from "react";
import { PlayerId, GamepadBindingMap } from "@game/types";
import {
  ConnectedGamepadVM,
  GamepadBindingsVM,
  getConnectedGamepadsVM,
  getGamepadBindingsVM,
  subscribeToGamepadConnection,
  subscribeToGamepadBindings,
  rebindGamepadAction,
  resetGamepadBindings,
  startGamepadButtonCapture,
} from "@components/adapters";
import { UseGamepadResult } from "../types";

export type { UseGamepadResult };

/**
 * Custom React hook for gamepad controller management, connection tracking, and rebinding.
 * Delegates engine synchronization and hardware polling to controlsAdapter.
 */
export function useGamepad(selectedPlayer: PlayerId): UseGamepadResult {
  const [connectedPads, setConnectedPads] = useState<ConnectedGamepadVM[]>(getConnectedGamepadsVM);
  const [bindings, setBindings] = useState<GamepadBindingsVM>(() =>
    getGamepadBindingsVM(selectedPlayer)
  );
  const [listeningAction, setListeningAction] = useState<keyof GamepadBindingMap | null>(null);
  const [lastPressedButton, setLastPressedButton] = useState<number | null>(null);

  const activePadIndex = selectedPlayer === PlayerId.Player1 ? 0 : 1;
  const currentPad = connectedPads.find((p) => p.index === activePadIndex);

  // Synchronize connected gamepads list and handle disconnect safety
  useEffect(() => {
    setConnectedPads(getConnectedGamepadsVM());
    return subscribeToGamepadConnection((connected, pad) => {
      setConnectedPads(getConnectedGamepadsVM());
      if (!connected && pad.index === activePadIndex) {
        setListeningAction(null);
      }
    });
  }, [activePadIndex]);

  // Synchronize bindings when player changes or when bindings update externally
  useEffect(() => {
    setBindings(getGamepadBindingsVM(selectedPlayer));
    setListeningAction(null);

    return subscribeToGamepadBindings(() => {
      setBindings(getGamepadBindingsVM(selectedPlayer));
    });
  }, [selectedPlayer]);

  // Capture button press during active rebind listening
  useEffect(() => {
    if (!listeningAction) return;

    return startGamepadButtonCapture(
      activePadIndex,
      (buttonIndex) => {
        setLastPressedButton(buttonIndex);
        rebindGamepadAction(selectedPlayer, listeningAction, buttonIndex);
        setListeningAction(null);
      },
      () => {
        setListeningAction(null);
      }
    );
  }, [listeningAction, activePadIndex, selectedPlayer]);

  const resetDefaults = useCallback(() => {
    resetGamepadBindings(selectedPlayer);
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
