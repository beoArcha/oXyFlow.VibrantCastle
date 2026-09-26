import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { SaveState, LocationId } from "../game/types";
import gameEngine from "../game/loop/engine";
import { gameSave } from "../game/logic/save";
import { useI18n } from "./I18nContext";
import { IContext } from "./IContext";
import { useSafeTimeout } from "./useSafeTimeout";
import { getLogger } from "../lib/logger";
import { MissingContextProviderError } from "../lib/errors";

const saveContextLogger = getLogger("context:save");

export interface SaveGameContextValue extends IContext<SaveState | null> {
  saveNotification: string;
  lastSavedState: SaveState | null;

  setSaveNotification: (text: string) => void;
  showNotification: (msg: string) => void;

  // Primary save actions
  saveGame: () => void;
  loadGame: (fileEvent?: React.ChangeEvent<HTMLInputElement>) => void;

  // Dedicated file & storage helpers
  exportSaveToFile: () => void;
  importSaveFromFile: (file: File) => Promise<boolean>;
}

const SaveGameContext = createContext<SaveGameContextValue | null>(null);

export const SaveGameProvider: React.FC<{
  children: React.ReactNode;
  onStateApplied?: () => void;
}> = ({ children, onStateApplied }) => {
  const { t } = useI18n();
  const { setSafeTimeout } = useSafeTimeout();
  const [saveNotification, setSaveNotification] = useState("");
  const [lastSavedState, setLastSavedState] = useState<SaveState | null>(() => {
    return gameSave.loadFromLocalStorage();
  });
  const [isLoaded, setIsLoaded] = useState(true);

  const showNotification = useCallback((msg: string) => {
    setSaveNotification(msg);
    setSafeTimeout(() => setSaveNotification(""), 3500);
  }, [setSafeTimeout]);

  const saveToLocalStorage = useCallback(() => {
    const state = gameSave.compileSaveState(
      gameEngine.players,
      gameEngine.enemies,
      gameEngine.entities,
      gameEngine.currentLocationId
    );
    setLastSavedState(state);
    showNotification(t("saveSuccess"));
  }, [showNotification, t]);

  const loadFromLocalStorage = useCallback((): boolean => {
    const saved = gameSave.loadFromLocalStorage();
    if (!saved) {
      showNotification(t("noSaveFound"));
      return false;
    }

    if (saved.levelId && saved.levelId !== gameEngine.currentLocationId) {
      gameEngine.loadLocation(saved.levelId as LocationId);
    }

    const ok = gameSave.applySaveState(
      saved,
      gameEngine.players,
      gameEngine.enemies,
      gameEngine.entities
    );

    if (ok) {
      setLastSavedState(saved);
      if (onStateApplied) onStateApplied();
      showNotification(t("loadSuccess"));
      return true;
    } else {
      showNotification(t("invalidSaveFormat"));
      return false;
    }
  }, [onStateApplied, showNotification, t]);

  const resetToDefaults = useCallback(() => {
    gameSave.clearSave();
    setLastSavedState(null);
    gameEngine.resetLevel();
    if (onStateApplied) onStateApplied();
    showNotification(t("restartLocation"));
  }, [onStateApplied, showNotification, t]);

  const exportToJson = useCallback((): string => {
    const state =
      lastSavedState ||
      gameSave.compileSaveState(
        gameEngine.players,
        gameEngine.enemies,
        gameEngine.entities,
        gameEngine.currentLocationId
      );
    return JSON.stringify(state, null, 2);
  }, [lastSavedState]);

  const importFromJson = useCallback(
    (jsonString: string): boolean => {
      const parseResult = gameSave.parseSaveJson(jsonString);
      if (!parseResult.ok) {
        saveContextLogger.error("Failed to parse imported save JSON", parseResult.error.toLogContext(), parseResult.error);
        showNotification(t("invalidSaveFormat"));
        return false;
      }

      const parsed = parseResult.value;
      if (parsed.levelId !== gameEngine.currentLocationId) {
        gameEngine.loadLocation(parsed.levelId as LocationId);
      }

      const ok = gameSave.applySaveState(
        parsed,
        gameEngine.players,
        gameEngine.enemies,
        gameEngine.entities
      );

      if (ok) {
        setLastSavedState(parsed);
        gameSave.saveStateToStorage(parsed);
        if (onStateApplied) onStateApplied();
        showNotification(t("loadSuccess"));
        return true;
      } else {
        showNotification(t("invalidSaveFormat"));
        return false;
      }
    },
    [onStateApplied, showNotification, t]
  );

  const exportSaveToFile = useCallback(() => {
    const state = gameSave.compileSaveState(
      gameEngine.players,
      gameEngine.enemies,
      gameEngine.entities,
      gameEngine.currentLocationId
    );
    setLastSavedState(state);
    gameSave.exportToFile(state);
    showNotification(t("saveSuccess"));
  }, [showNotification, t]);

  const saveGame = useCallback(() => {
    exportSaveToFile();
  }, [exportSaveToFile]);

  const importSaveFromFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const text = await file.text();
        return importFromJson(text);
      } catch (err) {
        saveContextLogger.error("Error loading save file:", undefined, err);
        showNotification(t("saveLoadError"));
        return false;
      }
    },
    [importFromJson, showNotification, t]
  );

  const loadGame = useCallback(
    (fileEvent?: React.ChangeEvent<HTMLInputElement>) => {
      if (fileEvent && fileEvent.target.files && fileEvent.target.files[0]) {
        const file = fileEvent.target.files[0];
        importSaveFromFile(file);
      } else {
        loadFromLocalStorage();
      }
    },
    [importSaveFromFile, loadFromLocalStorage]
  );

  const value = useMemo<SaveGameContextValue>(
    () => ({
      isLoaded,
      saveNotification,
      lastSavedState,
      setSaveNotification,
      showNotification,
      saveGame,
      loadGame,
      saveToLocalStorage,
      loadFromLocalStorage,
      resetToDefaults,
      exportToJson,
      importFromJson,
      exportSaveToFile,
      importSaveFromFile,
    }),
    [
      isLoaded,
      saveNotification,
      lastSavedState,
      showNotification,
      saveGame,
      loadGame,
      saveToLocalStorage,
      loadFromLocalStorage,
      resetToDefaults,
      exportToJson,
      importFromJson,
      exportSaveToFile,
      importSaveFromFile,
    ]
  );

  return (
    <SaveGameContext.Provider value={value}>
      {children}
    </SaveGameContext.Provider>
  );
};

export function useSaveGame(): SaveGameContextValue {
  const context = useContext(SaveGameContext);
  if (!context) {
    throw new MissingContextProviderError("useSaveGame", "SaveGameProvider");
  }
  return context;
}
