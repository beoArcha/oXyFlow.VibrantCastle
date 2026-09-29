import { useState, useCallback, useMemo } from "react";
import { PlayerId, InputMap } from "@game/types";
import gameInputs from "@game/loop/input";

export interface UseKeyboardResult {
  bindings: Record<keyof InputMap, string[]>;
  resetDefaults: () => void;
}

/**
 * Custom React hook for inspecting and resetting player keyboard bindings.
 * Interacts directly with the GameInputEngine singleton.
 *
 * @param selectedPlayer Player whose bindings are being inspected/reset
 */
export function useKeyboard(selectedPlayer: PlayerId): UseKeyboardResult {
  const [, setTick] = useState(0);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setTick((prev) => prev + 1);
  }, [selectedPlayer]);

  const bindings = gameInputs.getKeyboardBindings(selectedPlayer);

  return useMemo(
    () => ({
      bindings,
      resetDefaults,
    }),
    [bindings, resetDefaults]
  );
}

export default useKeyboard;
