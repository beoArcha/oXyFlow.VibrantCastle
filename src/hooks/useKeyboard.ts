import { useState, useCallback } from "react";
import { PlayerId, InputMap } from "../game/types";
import gameInputs from "../game/loop/input";

export function useKeyboard(selectedPlayer: PlayerId) {
  const [refreshKey, setRefreshKey] = useState(0);

  const bindings = gameInputs.getKeyboardBindings(selectedPlayer);

  const resetDefaults = useCallback(() => {
    gameInputs.resetToDefaults(selectedPlayer);
    setRefreshKey((prev) => prev + 1);
  }, [selectedPlayer]);

  const updateBinding = useCallback(
    (action: keyof InputMap, keys: string[]) => {
      gameInputs.setKeyboardBinding(selectedPlayer, action, keys);
      setRefreshKey((prev) => prev + 1);
    },
    [selectedPlayer]
  );

  return {
    bindings,
    resetDefaults,
    updateBinding,
    refreshKey,
  };
}

export default useKeyboard;
