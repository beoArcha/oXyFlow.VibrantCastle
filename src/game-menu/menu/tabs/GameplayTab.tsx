import React, { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ConfirmDialog } from "@ui";
import { useI18n } from "@context/I18nContext";
import { useSettings } from "@context/SettingsContext";
import { useGameEngine } from "@context/GameEngineContext";
import { useSaveGame } from "@context/SaveGameContext";
import { GameModeSection, GameSaveSection } from "./gameplay";
import { cn } from "@lib/utils";

export interface GameplayTabProps {
  readonly className?: string;
}

export const GameplayTab = ({ className }: GameplayTabProps = {}): React.ReactElement => {
  const { t } = useI18n();
  const {
    isTwoPlayer,
    setTwoPlayer,
    primaryCharacter,
    setPrimaryCharacter,
  } = useSettings();

  const { restart, setPlayerCharacter } = useGameEngine();
  const [confirmRestart, setConfirmRestart] = useState(false);

  const handleSelectCharacter = useCallback(
    (charId: "valen" | "aurelia") => {
      const success = setPlayerCharacter(0, charId);
      if (success) {
        setPrimaryCharacter(charId);
      }
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

      <div className="flex justify-end">
        <Button
          id="restart-level-btn"
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={13} />}
          onClick={() => setConfirmRestart(true)}
          className="border-amber-700/60 hover:border-amber-500"
        >
          {t("restartLocation")}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false);
          restart();
        }}
        title={t("restartConfirmTitle")}
        message={t("restartConfirmMessage")}
        confirmLabel={t("restartConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />
    </div>
  );
};

export default GameplayTab;
