import { useEffect } from "react";
import { GameSettingsState } from "../settingsTypes";
import gameEngine from "../../game/loop/engine";
import { gameAudio } from "../../game/engine/audioEngine";
import { useEngineSubscription } from "../useEngineSubscription";

/**
 * Custom hook encapsulating synchronization of game settings with
 * external subsystems: GameEngine, GameAudioEngine, and reactive 2-player state.
 */
export function useSettingsSync(
  settings: GameSettingsState,
  onEngineTwoPlayerChange: (isTwoPlayer: boolean) => void
): void {
  // Sync to gameEngine on mount or setting change
  useEffect(() => {
    gameEngine.settings.isTwoPlayer = settings.isTwoPlayer;
    gameEngine.settings.volumeMusic = settings.volumeMusic;
    gameEngine.settings.volumeSFX = settings.volumeSFX;
    gameEngine.settings.display = settings.display;
    gameEngine.settings.language = settings.language;
    gameAudio.setBGMVolume(settings.volumeMusic);
    gameAudio.setSFXVolume(settings.volumeSFX);

    if (settings.display.targetFps) {
      gameEngine.setTargetFps(settings.display.targetFps);
    }
    gameEngine.setShowFpsCounter(!!settings.display.showFpsCounter);
    gameEngine.setHardwareAcceleration(settings.display.hardwareAcceleration !== false);

    // Keep gameEngine players synchronized on mount/change
    if (settings.isTwoPlayer && gameEngine.players.length === 1) {
      gameEngine.setTwoPlayerMode(true, true);
    } else if (!settings.isTwoPlayer && gameEngine.players.length > 1) {
      gameEngine.setTwoPlayerMode(false, true);
    }
  }, [settings]);

  // Keep React settings context synchronized with engine state changes (portal transitions, save loads)
  useEngineSubscription(() => {
    const engineIs2P = gameEngine.players.length > 1;
    onEngineTwoPlayerChange(engineIs2P);
  }, gameEngine);
}
