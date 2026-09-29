import { useState, useCallback, useEffect } from "react";
import { PlayerId, InputMap } from "@game/types";
import gameInputs from "@game/loop/input";

export interface UseKeyboardResult {
  bindings: Record<keyof InputMap, string[]>;
  resetDefaults: () => void;
}

/**
 * Custom React hook for inspecting and resetting player keyboard bindings.
 * Interacts directly with the GameInputEngine singleton.
 */
export function useKeyboard(selectedPlayer: PlayerId): UseKeyboardResult {
  const [, setTick] = useState(0);

  useEffect(() => {
    setTick((prev) => prev + 1);
  }, [selectedPlayer]);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setTick((prev) => prev + 1);
  }, [selectedPlayer]);

  return {
    bindings: gameInputs.getKeyboardBindings(selectedPlayer),
    resetDefaults,
  };
}
