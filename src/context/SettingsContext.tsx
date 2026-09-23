import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { DisplaySettings } from "../game/types";
import gameEngine from "../game/loop/engine";
import { gameAudio } from "../game/engine/audioEngine";
import { useEngineSubscription } from "./useEngineSubscription";
import {
  GameSettingsState,
  DEFAULT_SETTINGS,
  SettingsContextValue,
  HudSettings,
} from "./settingsTypes";

const SETTINGS_STORAGE_KEY = "vibrant_castle_full_settings";
const LEGACY_DISPLAY_STORAGE_KEY = "vibrant_castle_display_settings";

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadInitialSettings(): GameSettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          display: { ...DEFAULT_SETTINGS.display, ...(parsed.display || {}) },
          hud: {
            ...DEFAULT_SETTINGS.hud,
            ...(parsed.hud || {}),
            p1QuickKeys: {
              ...DEFAULT_SETTINGS.hud.p1QuickKeys,
              ...(parsed.hud?.p1QuickKeys || {}),
            },
            p2QuickKeys: {
              ...DEFAULT_SETTINGS.hud.p2QuickKeys,
              ...(parsed.hud?.p2QuickKeys || {}),
            },
          },
        };
      }
    }

    // Check legacy display storage
    const legacyDisplay = localStorage.getItem(LEGACY_DISPLAY_STORAGE_KEY);
    if (legacyDisplay) {
      const parsedDisplay = JSON.parse(legacyDisplay);
      if (parsedDisplay && parsedDisplay.assetQuality) {
        return {
          ...DEFAULT_SETTINGS,
          display: {
            ...DEFAULT_SETTINGS.display,
            aspectRatio: parsedDisplay.aspectRatio || "16:10",
            scalingFilter: parsedDisplay.scalingFilter || "pixel",
            assetQuality: parsedDisplay.assetQuality || "high",
            targetFps: parsedDisplay.targetFps || 60,
            showFpsCounter: !!parsedDisplay.showFpsCounter,
            hardwareAcceleration:
              parsedDisplay.hardwareAcceleration !== undefined
                ? parsedDisplay.hardwareAcceleration
                : true,
          },
        };
      }
    }
  } catch (err) {
    console.warn("Failed to read settings from localStorage, using defaults:", err);
  }

  return DEFAULT_SETTINGS;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<GameSettingsState>(loadInitialSettings);
  const [isLoaded, setIsLoaded] = useState(true);

  // Persist helper
  const persist = useCallback((nextSettings: GameSettingsState) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      localStorage.setItem(
        LEGACY_DISPLAY_STORAGE_KEY,
        JSON.stringify(nextSettings.display)
      );
    } catch (e) {
      console.error("Failed to write settings to localStorage:", e);
    }
  }, []);

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
    setSettings((prev) => {
      if (prev.isTwoPlayer !== engineIs2P) {
        const next = { ...prev, isTwoPlayer: engineIs2P };
        persist(next);
        return next;
      }
      return prev;
    });
  }, gameEngine);

  const saveToLocalStorage = useCallback(() => {
    persist(settings);
  }, [persist, settings]);

  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const reloaded = loadInitialSettings();
      setSettings(reloaded);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  const exportToJson = useCallback((): string => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importFromJson = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== "object") return false;
        const merged: GameSettingsState = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          display: { ...DEFAULT_SETTINGS.display, ...(parsed.display || {}) },
          hud: {
            ...DEFAULT_SETTINGS.hud,
            ...(parsed.hud || {}),
            p1QuickKeys: {
              ...DEFAULT_SETTINGS.hud.p1QuickKeys,
              ...(parsed.hud?.p1QuickKeys || {}),
            },
            p2QuickKeys: {
              ...DEFAULT_SETTINGS.hud.p2QuickKeys,
              ...(parsed.hud?.p2QuickKeys || {}),
            },
          },
        };
        setSettings(merged);
        persist(merged);
        return true;
      } catch (err) {
        console.error("Failed to import settings JSON:", err);
        return false;
      }
    },
    [persist]
  );

  const exportSettingsToFile = useCallback(() => {
    const jsonStr = exportToJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibrant_castle_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportToJson]);

  const importSettingsFromFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const text = await file.text();
        return importFromJson(text);
      } catch {
        return false;
      }
    },
    [importFromJson]
  );

  const setDisplaySettings = useCallback(
    (displayUpdates: Partial<DisplaySettings>) => {
      setSettings((prev) => {
        const next: GameSettingsState = {
          ...prev,
          display: { ...prev.display, ...displayUpdates },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setVolumeMusic = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, volumeMusic: clamped };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setVolumeSFX = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, volumeSFX: clamped };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setTwoPlayer = useCallback(
    (val: boolean) => {
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, isTwoPlayer: val };
        persist(next);
        return next;
      });
      gameEngine.setTwoPlayerMode(val, true);
    },
    [persist]
  );

  const setHudSettings = useCallback(
    (hudUpdates: Partial<HudSettings>) => {
      setSettings((prev) => {
        const next: GameSettingsState = {
          ...prev,
          hud: { ...prev.hud, ...hudUpdates },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateSettings = useCallback(
    (partial: Partial<GameSettingsState>) => {
      setSettings((prev) => {
        const next: GameSettingsState = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
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
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
