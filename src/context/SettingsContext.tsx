import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { DisplaySettings } from "@game/types";
import gameEngine from "@game/loop/engine";
import {
  GameSettingsState,
  DEFAULT_SETTINGS,
  SettingsContextValue,
  HudSettings,
} from "./settingsTypes";
import {
  ISettingsStorage,
  defaultSettingsStorage,
  useSettingsSync,
} from "./settings";
import { MissingContextProviderError } from "@lib/errors";

const SettingsContext = createContext<SettingsContextValue | null>(null);

export interface SettingsProviderProps {
  children: React.ReactNode;
  storage?: ISettingsStorage;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  storage = defaultSettingsStorage,
}) => {
  const [settings, setSettings] = useState<GameSettingsState>(() => storage.load());
  const [isLoaded] = useState(true);

  // Sync settings with external subsystems (engine, audio, 2-player state)
  const handleEngineTwoPlayerChange = useCallback(
    (engineIs2P: boolean) => {
      setSettings((prev) => {
        if (prev.isTwoPlayer !== engineIs2P) {
          const next = { ...prev, isTwoPlayer: engineIs2P };
          storage.save(next);
          return next;
        }
        return prev;
      });
    },
    [storage]
  );

  useSettingsSync(settings, handleEngineTwoPlayerChange);

  // Storage and import/export actions delegated to ISettingsStorage
  const saveToLocalStorage = useCallback(() => {
    storage.save(settings);
  }, [storage, settings]);

  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const reloaded = storage.load();
      setSettings(reloaded);
      return true;
    } catch {
      return false;
    }
  }, [storage]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    storage.save(DEFAULT_SETTINGS);
  }, [storage]);

  const exportToJson = useCallback((): string => {
    return storage.exportToJson(settings);
  }, [storage, settings]);

  const importFromJson = useCallback(
    (jsonString: string): boolean => {
      const merged = storage.importFromJson(jsonString);
      if (merged) {
        setSettings(merged);
        return true;
      }
      return false;
    },
    [storage]
  );

  const exportSettingsToFile = useCallback(() => {
    storage.exportToFile(settings);
  }, [storage, settings]);

  const importSettingsFromFile = useCallback(
    async (file: File): Promise<boolean> => {
      const merged = await storage.importFromFile(file);
      if (merged) {
        setSettings(merged);
        return true;
      }
      return false;
    },
    [storage]
  );

  // Granular mutation actions
  const setDisplaySettings = useCallback(
    (displayUpdates: Partial<DisplaySettings>) => {
      setSettings((prev) => {
        const next: GameSettingsState = {
          ...prev,
          display: { ...prev.display, ...displayUpdates },
        };
        storage.save(next);
        return next;
      });
    },
    [storage]
  );

  const setVolumeMusic = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, volumeMusic: clamped };
        storage.save(next);
        return next;
      });
    },
    [storage]
  );

  const setVolumeSFX = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, volumeSFX: clamped };
        storage.save(next);
        return next;
      });
    },
    [storage]
  );

  const setTwoPlayer = useCallback(
    (val: boolean) => {
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, isTwoPlayer: val };
        storage.save(next);
        return next;
      });
      gameEngine.setTwoPlayerMode(val, true);
    },
    [storage]
  );

  const setHudSettings = useCallback(
    (hudUpdates: Partial<HudSettings>) => {
      setSettings((prev) => {
        const next: GameSettingsState = {
          ...prev,
          hud: { ...prev.hud, ...hudUpdates },
        };
        storage.save(next);
        return next;
      });
    },
    [storage]
  );

  const updateSettings = useCallback(
    (partial: Partial<GameSettingsState>) => {
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, ...partial };
        storage.save(next);
        return next;
      });
    },
    [storage]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      isLoaded,
      settings,
      displaySettings: settings.display,
      volumeMusic: settings.volumeMusic,
      volumeSFX: settings.volumeSFX,
      isTwoPlayer: settings.isTwoPlayer,
      hudSettings: settings.hud,
      setDisplaySettings,
      setVolumeMusic,
      setVolumeSFX,
      setTwoPlayer,
      setHudSettings,
      updateSettings,
      resetToDefaults,
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
      exportSettingsToFile,
      importSettingsFromFile,
    }),
    [
      isLoaded,
      settings,
      setDisplaySettings,
      setVolumeMusic,
      setVolumeSFX,
      setTwoPlayer,
      setHudSettings,
      updateSettings,
      resetToDefaults,
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
      exportSettingsToFile,
      importSettingsFromFile,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new MissingContextProviderError("useSettings", "SettingsProvider");
  }
  return context;
}
