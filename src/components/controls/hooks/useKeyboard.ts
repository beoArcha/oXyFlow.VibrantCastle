import { useCallback, useSyncExternalStore } from "react";
import { PlayerId, InputMap } from "@game/types";
import gameInputs from "@game/loop/input";

export interface UseKeyboardResult {
  bindings: Record<keyof InputMap, string[]>;
  resetDefaults: () => void;
}

/**
 * Custom React hook for inspecting and resetting player keyboard bindings.
 * Subscribes reactively to the GameInputEngine via useSyncExternalStore.
 *
 * @param selectedPlayer Player whose bindings are being inspected/reset
 */
export function useKeyboard(selectedPlayer: PlayerId): UseKeyboardResult {
  const subscribe = useCallback((onStoreChange: () => void) => {
    return gameInputs.onBindingsChange(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    return gameInputs.getKeyboardBindings(selectedPlayer);
  }, [selectedPlayer]);

  const bindings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
  }, [selectedPlayer]);

  return {
    bindings,
    resetDefaults,
  };
}

export default useKeyboard;
