import React, { useCallback } from "react";
import { useSettings } from "@context/SettingsContext";
import { useGameEngine } from "@context/GameEngineContext";
import { useSaveGame } from "@context/SaveGameContext";
import {
  GameModeSection,
  GameSaveSection,
  GameHudSection,
  GameCombatTipsSection,
  GameConfigBarSection,
} from "./gameplay";
import { cn } from "@lib/utils";

export interface GameplayTabProps {
  readonly className?: string;
}

export const GameplayTab = ({ className }: GameplayTabProps = {}): React.ReactElement => {
  const {
    isTwoPlayer,
    setTwoPlayer,
    primaryCharacter,
    setPrimaryCharacter,
    hudSettings,
    setHudSettings,
    exportSettingsToFile,
    importSettingsFromFile,
    resetToDefaults: resetSettingsToDefaults,
  } = useSettings();

  const { restart, setPlayerCharacter } = useGameEngine();

  const handleSelectCharacter = useCallback(
    (charId: "valen" | "aurelia") => {
      setPrimaryCharacter(charId);
      setPlayerCharacter(0, charId);
    },
    [setPrimaryCharacter, setPlayerCharacter]
  );

  const {
    saveGame,
    loadGame,
    saveToLocalStorage,
    loadFromLocalStorage,
  } = useSaveGame();

  return (
    <div
      id="tab-content-gameplay"
      className={cn("flex flex-col gap-5 animate-in fade-in duration-150", className)}
    >
      <GameModeSection
        isTwoPlayer={isTwoPlayer}
        onSelectMode={setTwoPlayer}
        primaryCharacter={primaryCharacter}
        onSelectCharacter={handleSelectCharacter}
      />

      <GameSaveSection
        onSaveToLocalStorage={saveToLocalStorage}
        onLoadFromLocalStorage={() => loadFromLocalStorage()}
        onSaveGame={saveGame}
        onLoadGame={loadGame}
      />

      <GameHudSection
        hudSettings={hudSettings}
        onToggleRpgButtons={() =>
          setHudSettings({ showRpgButtons: !hudSettings.showRpgButtons })
        }
        onToggleControlsHint={() =>
          setHudSettings({ showControlsHint: !hudSettings.showControlsHint })
        }
        onToggleNarratorSubtitles={() =>
          setHudSettings({ showNarratorSubtitles: !hudSettings.showNarratorSubtitles })
        }
      />

      <GameCombatTipsSection />

      <GameConfigBarSection
        onExportSettings={exportSettingsToFile}
        onImportSettings={importSettingsFromFile}
        onResetDefaults={resetSettingsToDefaults}
        onRestartLocation={restart}
      />
    </div>
  );
};

export default GameplayTab;
