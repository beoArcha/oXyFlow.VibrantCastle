import { useEffect } from "react";
import { GameSettingsState } from "../settingsTypes";
import gameEngine from "@game/loop/engine";

/**
 * Custom hook encapsulating unidirectional synchronization of game settings with
 * external subsystems via encapsulated engine commands (AGENT.md Sec. 2.2).
 */
export function useSettingsSync(settings: GameSettingsState): void {
  // Unidirectional sync to gameEngine on mount or setting change via encapsulated domain method
  useEffect(() => {
    gameEngine.applySettings(settings);
  }, [settings]);
}
