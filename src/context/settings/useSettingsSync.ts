import { useEffect } from "react";
import { GameSettingsState } from "./settingsTypes";
import { readBrowserParallaxSignals } from "./browserParallaxSignals";
import gameEngine from "@game/loop/engine";

/**
 * Custom hook encapsulating unidirectional synchronization of game settings with
 * external subsystems via the game engine.
 */
export function useSettingsSync(settings: GameSettingsState): void {
  useEffect(() => {
    gameEngine.setDeviceParallaxSignals?.(readBrowserParallaxSignals());
    gameEngine.applySettings(settings);
  }, [settings]);
}
