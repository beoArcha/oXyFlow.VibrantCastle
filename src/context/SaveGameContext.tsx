import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { SaveState } from "@game/types";
import gameEngine from "@game/loop/engine";
import { gameSave } from "@game/logic/save";
import { useI18n } from "./I18nContext";
import { IContext, INotifiableContext, BaseProviderProps } from "./IContext";
import { useSafeTimeout } from "./hooks/useSafeTimeout";
import { getLogger } from "@lib/logger";
import { MissingContextProviderError } from "@lib/errors";

const saveContextLogger = getLogger("context:save");

export interface SaveGameContextValue extends IContext, INotifiableContext {
  saveNotification: string;
  lastSavedState: SaveState | null;

  setSaveNotification: (text: string) => void;
  showNotification: (msg: string, durationMs?: number) => void;

  // Primary save actions
  saveGame: () => void;
  loadGame: (fileOrEvent?: File | React.ChangeEvent<HTMLInputElement>) => void;

  // Dedicated file & storage helpers (IFilePersistenceContext implementation & aliases)
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<boolean>;
  exportSaveToFile: () => void;
  importSaveFromFile: (file: File) => Promise<boolean>;
}

const SaveGameContext = createContext<SaveGameContextValue | null>(null);

export interface SaveGameProviderProps extends BaseProviderProps {
  onStateApplied?: () => void;
}

export const SaveGameProvider: React.FC<SaveGameProviderProps> = ({ children, onStateApplied }) => {
  const { t } = useI18n();
  const { setSafeTimeout } = useSafeTimeout();
  const [saveNotification, setSaveNotification] = useState("");
  const [lastSavedState, setLastSavedState] = useState<SaveState | null>(() => {
    return gameSave.loadFromLocalStorage();
  });
  const isLoaded = true;

  const showNotification = useCallback((msg: string, durationMs: number = 3500) => {
    setSaveNotification(msg);
    setSafeTimeout(() => setSaveNotification(""), durationMs);
  }, [setSafeTimeout]);

  const saveToLocalStorage = useCallback(() => {
    const state = gameEngine.createSaveSnapshot();
    gameSave.saveStateToStorage(state);
    setLastSavedState(state);
    showNotification(t("saveSuccess"));
  }, [showNotification, t]);

  const loadFromLocalStorage = useCallback((): boolean => {
    const saved = gameSave.loadFromLocalStorage();
    if (!saved) {
      showNotification(t("noSaveFound"));
      return false;
    }

    const ok = gameEngine.restoreFromSnapshot(saved);
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
    const state = lastSavedState || gameEngine.createSaveSnapshot();
    return JSON.stringify(state, null, 2);
  }, [lastSavedState]);

  const importFromJson = useCallback(
    (jsonString: string): boolean => {
      const parseResult = gameSave.parseSaveJson(jsonString);
      if (!parseResult.ok) {
        saveContextLogger.error(
          "Failed to parse imported save JSON",
          parseResult.error.toLogContext(),
          parseResult.error
        );
        showNotification(t("invalidSaveFormat"));
        return false;
      }

      const parsed = parseResult.value;
      const ok = gameEngine.restoreFromSnapshot(parsed);

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
    const state = gameEngine.createSaveSnapshot();
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
        saveContextLogger.error(
          "Error loading save file:",
          { fileName: file.name, fileSize: file.size, fileType: file.type },
          err
        );
        showNotification(t("saveLoadError"));
        return false;
      }
    },
    [importFromJson, showNotification, t]
  );

  const loadGame = useCallback(
    (fileOrEvent?: File | React.ChangeEvent<HTMLInputElement>) => {
      if (fileOrEvent instanceof File) {
        importSaveFromFile(fileOrEvent);
      } else if (fileOrEvent && "target" in fileOrEvent && fileOrEvent.target.files?.[0]) {
        importSaveFromFile(fileOrEvent.target.files[0]);
      } else {
        loadFromLocalStorage();
      }
    },
    [importSaveFromFile, loadFromLocalStorage]
  );

  const value = useMemo<SaveGameContextValue>(
    () => ({
      isLoaded,
      notification: saveNotification,
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
      exportToFile: exportSaveToFile,
      importFromFile: importSaveFromFile,
    }),
    [
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
