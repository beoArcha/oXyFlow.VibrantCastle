import { useCallback } from "react";
import { InputMap, PlayerId } from "@game/types";
import { useControls } from "@context/ControlsContext";

export interface UseKeyboardResult {
  readonly bindings: Record<keyof InputMap, string[]>;
  readonly setBinding: (action: keyof InputMap, code: string, key?: string) => void;
  readonly resetBindings: () => void;
}

/**
 * Hook providing reactive keyboard bindings for a specific player.
 */
export function useKeyboard(playerId: PlayerId = PlayerId.Player1): UseKeyboardResult {
  const { p1Keyboard, p2Keyboard, rebindKeyboard, resetBindings } = useControls();

  const bindings = playerId === PlayerId.Player2 ? p2Keyboard : p1Keyboard;

  const setBinding = useCallback(
    (action: keyof InputMap, code: string, key?: string) => {
      rebindKeyboard(playerId, action, code, key);
    },
    [playerId, rebindKeyboard]
  );

  const handleReset = useCallback(() => {
    resetBindings(playerId);
  }, [playerId, resetBindings]);

  return {
    bindings,
    setBinding,
    resetBindings: handleReset,
  };
}
