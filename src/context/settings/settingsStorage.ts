import { GameSettingsState, DEFAULT_SETTINGS } from "../settingsTypes";
import { getLogger, ILogger } from "../../lib/logger";

const settingsLogger = getLogger("context:settings");

export interface ISettingsStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ISettingsStorage {
  load(): GameSettingsState;
  save(settings: GameSettingsState): boolean;
  exportToJson(settings: GameSettingsState): string;
  importFromJson(jsonString: string): GameSettingsState | null;
  exportToFile(settings: GameSettingsState): void;
  importFromFile(file: File): Promise<GameSettingsState | null>;
}

export class SettingsStorage implements ISettingsStorage {
  public static readonly SETTINGS_STORAGE_KEY = "vibrant_castle_full_settings";
  public static readonly LEGACY_DISPLAY_STORAGE_KEY = "vibrant_castle_display_settings";

  constructor(
    private readonly storage: ISettingsStorageProvider = typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : { getItem: () => null, setItem: () => {} },
    private readonly logger: ILogger = settingsLogger
  ) {}

  public load(): GameSettingsState {
    try {
      const raw = this.storage.getItem(SettingsStorage.SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return this.mergeWithDefaults(parsed);
        }
      }

      // Check legacy display storage
      const legacyDisplay = this.storage.getItem(SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY);
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
      this.logger.warn(
        "Failed to read settings from localStorage, using defaults:",
        { storageKey: SettingsStorage.SETTINGS_STORAGE_KEY },
        err
      );
    }

    return DEFAULT_SETTINGS;
  }

  public save(settings: GameSettingsState): boolean {
    try {
      this.storage.setItem(SettingsStorage.SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      this.storage.setItem(
        SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY,
        JSON.stringify(settings.display)
      );
      return true;
    } catch (e) {
      this.logger.error(
        "Failed to write settings to localStorage:",
        { storageKey: SettingsStorage.SETTINGS_STORAGE_KEY },
        e
      );
      return false;
    }
  }

  public exportToJson(settings: GameSettingsState): string {
    return JSON.stringify(settings, null, 2);
  }

  public importFromJson(jsonString: string): GameSettingsState | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") return null;
      const merged = this.mergeWithDefaults(parsed);
      this.save(merged);
      return merged;
    } catch (err) {
      this.logger.error("Failed to import settings JSON:", { context: "importSettingsFromJson" }, err);
      return null;
    }
  }

  public exportToFile(settings: GameSettingsState): void {
    if (typeof document === "undefined" || typeof Blob === "undefined") {
      return;
    }
    const jsonStr = this.exportToJson(settings);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibrant_castle_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public async importFromFile(file: File): Promise<GameSettingsState | null> {
    try {
      const text = await file.text();
      return this.importFromJson(text);
    } catch {
      return null;
    }
  }

  private mergeWithDefaults(parsed: Record<string, any>): GameSettingsState {
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

export const defaultSettingsStorage: ISettingsStorage = new SettingsStorage();
