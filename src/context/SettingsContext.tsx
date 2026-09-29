import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { DisplaySettings } from "@game/types";
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
import { BaseProviderProps } from "./IContext";

const SettingsContext = createContext<SettingsContextValue | null>(null);

export interface SettingsProviderProps extends BaseProviderProps {
  storage?: ISettingsStorage;
}

/**
 * Context provider managing persistent user preferences, audio levels, display settings,
 * HUD configurations, and game options with decoupled storage strategies.
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  storage = defaultSettingsStorage,
}) => {
  const [settings, setSettings] = useState<GameSettingsState>(() => storage.load());
  const isLoaded = true;

  useEffect(() => {
    storage.save(settings);
  }, [storage, settings]);

  useSettingsSync(settings);

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
  }, []);

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

  const setDisplaySettings = useCallback((displayUpdates: Partial<DisplaySettings>) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, ...displayUpdates },
    }));
  }, []);

  const setVolumeMusic = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setSettings((prev) => ({ ...prev, volumeMusic: clamped }));
  }, []);

  const setVolumeSFX = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setSettings((prev) => ({ ...prev, volumeSFX: clamped }));
  }, []);

  const setTwoPlayer = useCallback((val: boolean) => {
    setSettings((prev) => ({ ...prev, isTwoPlayer: val }));
  }, []);

  const setHudSettings = useCallback((hudUpdates: Partial<HudSettings>) => {
    setSettings((prev) => ({
      ...prev,
      hud: { ...prev.hud, ...hudUpdates },
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

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
      exportToFile: exportSettingsToFile,
      importFromFile: importSettingsFromFile,
    }),
    [
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

/**
 * Hook providing access to game settings, audio volume controls, display preferences, and persistence methods.
 *
 * @throws {MissingContextProviderError} when used outside a SettingsProvider.
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new MissingContextProviderError("useSettings", "SettingsProvider");
  }
  return context;
}
