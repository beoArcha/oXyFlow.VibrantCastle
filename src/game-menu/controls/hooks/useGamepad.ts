import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayerId, type GamepadBindingMap } from "@game/types";
import type { ConnectedGamepadInfo } from "@game/loop/input";
import defaultControlsJson from "@data/defaults/defaultControls.json";
import { useControls } from "@context/ControlsContext";
import {
  GAMEPAD_ACTION_KEYS,
  readPressedButtons,
  resolveGamepadCapture,
  type GamepadActionKey,
} from "../gamepadLayout";

/** Capture poll interval while a rebind is listening. */
export const GAMEPAD_CAPTURE_POLL_MS = 50;

const DEFAULT_GAMEPAD_BINDINGS: Record<PlayerId, GamepadBindingMap> = {
  [PlayerId.Player1]: defaultControlsJson.gamepad.player1 as unknown as GamepadBindingMap,
  [PlayerId.Player2]: defaultControlsJson.gamepad.player2 as unknown as GamepadBindingMap,
};

export interface UseGamepadResult {
  readonly connectedPads: readonly ConnectedGamepadInfo[];
  readonly currentPad: ConnectedGamepadInfo | undefined;
  readonly bindings: GamepadBindingMap;
  readonly listeningAction: GamepadActionKey | null;
  readonly setListeningAction: (action: GamepadActionKey | null) => void;
  readonly lastPressedButton: number | null;
  readonly rejectedButton: number | null;
  readonly resetDefaults: () => void;
}

function readNavigatorGamepad(index: number): Gamepad | null {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return null;
  return navigator.getGamepads()[index] ?? null;
}

/**
 * Gamepad rebinding for one player on the restricted pad layout. Connection and bindings come from
 * ControlsContext; while an action is listening, pad polling captures the next newly pressed button.
 * Non-bindable buttons are rejected and reported through `rejectedButton`.
 */
export function useGamepad(selectedPlayer: PlayerId): UseGamepadResult {
  const { connectedGamepads, getGamepadBindings, rebindGamepad } = useControls();
  const [listeningAction, setListeningAction] = useState<GamepadActionKey | null>(null);
  const [lastPressedButton, setLastPressedButton] = useState<number | null>(null);
  const [rejectedButton, setRejectedButton] = useState<number | null>(null);

  const activePadIndex = selectedPlayer === PlayerId.Player1 ? 0 : 1;
  const currentPad = connectedGamepads.find((pad) => pad.index === activePadIndex);
  const bindings = useMemo(
    () => getGamepadBindings(selectedPlayer),
    [getGamepadBindings, selectedPlayer]
  );

  // Switching player or losing the active pad cancels a pending capture.
  useEffect(() => {
    setListeningAction(null);
    setRejectedButton(null);
  }, [selectedPlayer]);

  useEffect(() => {
    if (!currentPad) setListeningAction(null);
  }, [currentPad]);

  useEffect(() => {
    if (listeningAction === null) return;

    let previouslyPressed: ReadonlySet<number> = new Set();
    const action = listeningAction;
    const timer = setInterval(() => {
      const pad = readNavigatorGamepad(activePadIndex);
      if (!pad) return;

      const pressedNow = readPressedButtons(pad.buttons);
      const outcome = resolveGamepadCapture(pressedNow, previouslyPressed);
      previouslyPressed = new Set(pressedNow);

      if (outcome.kind === "bind") {
        rebindGamepad(selectedPlayer, action, outcome.buttonIndex);
        setLastPressedButton(outcome.buttonIndex);
        setRejectedButton(null);
        setListeningAction(null);
      } else if (outcome.kind === "reject") {
        setRejectedButton(outcome.buttonIndex);
      }
    }, GAMEPAD_CAPTURE_POLL_MS);

    return () => clearInterval(timer);
  }, [listeningAction, activePadIndex, selectedPlayer, rebindGamepad]);

  const updateListeningAction = useCallback((action: GamepadActionKey | null) => {
    setRejectedButton(null);
    setListeningAction(action);
  }, []);

  const resetDefaults = useCallback(() => {
    const defaults = DEFAULT_GAMEPAD_BINDINGS[selectedPlayer];
    for (const action of GAMEPAD_ACTION_KEYS) {
      rebindGamepad(selectedPlayer, action, defaults[action]);
    }
    setListeningAction(null);
    setRejectedButton(null);
  }, [selectedPlayer, rebindGamepad]);

  return useMemo(
    () => ({
      connectedPads: connectedGamepads,
      currentPad,
      bindings,
      listeningAction,
      setListeningAction: updateListeningAction,
      lastPressedButton,
      rejectedButton,
      resetDefaults,
    }),
    [
      connectedGamepads,
      currentPad,
      bindings,
      listeningAction,
      updateListeningAction,
      lastPressedButton,
      rejectedButton,
      resetDefaults,
    ]
  );
}

export default useGamepad;
