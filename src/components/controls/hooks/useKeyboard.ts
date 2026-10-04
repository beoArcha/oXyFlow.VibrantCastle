import { useCallback, useSyncExternalStore } from "react";
import { PlayerId } from "@game/types";
import {
  getKeyboardBindingsVM,
  subscribeToKeyboardBindings,
  resetKeyboardBindings,
} from "@context";
import { UseKeyboardResult } from "../types";

export type { UseKeyboardResult };

/**
 * Custom React hook for inspecting and resetting player keyboard bindings.
 * Subscribes reactively to keyboard bindings via controlsAdapter and useSyncExternalStore.
 *
 * @param selectedPlayer Player whose bindings are being inspected/reset
 */
export function useKeyboard(selectedPlayer: PlayerId): UseKeyboardResult {
  const subscribe = useCallback((onStoreChange: () => void) => {
    return subscribeToKeyboardBindings(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    return getKeyboardBindingsVM(selectedPlayer);
  }, [selectedPlayer]);

  const bindings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const resetDefaults = useCallback(() => {
    resetKeyboardBindings(selectedPlayer);
  }, [selectedPlayer]);

  return {
    bindings,
    resetDefaults,
  };
}

export default useKeyboard;
