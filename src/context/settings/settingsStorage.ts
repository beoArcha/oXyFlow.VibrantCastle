import { GameSettingsState, DEFAULT_SETTINGS, HudSettings, HudQuickKeysSettings } from "./settingsTypes";
import { DisplaySettings } from "@game/types";
import { getLogger, ILogger } from "@lib/logger";
import defaultGameEngine from "@game/loop/engine";

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
    private readonly storage?: ISettingsStorageProvider,
    private readonly logger: ILogger = settingsLogger
  ) { }

  private get effectiveStorage(): ISettingsStorageProvider {
    if (this.storage) {
      return this.storage;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    return { getItem: () => null, setItem: () => { } };
  }

  public load(): GameSettingsState {
    try {
      const raw = this.effectiveStorage.getItem(SettingsStorage.SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const merged = this.mergeWithDefaults(parsed);
          if (defaultGameEngine && merged.primaryCharacter) {
            defaultGameEngine.applySettings({ primaryCharacter: merged.primaryCharacter });
          }
          return merged;
        }
      }

      // Check legacy display storage
      const legacyDisplay = this.effectiveStorage.getItem(SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY);
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

    const engineIsTwoPlayer = defaultGameEngine?.settings?.isTwoPlayer;
    const enginePrimaryChar = defaultGameEngine?.defaultPrimaryCharacter;

    return {
      ...DEFAULT_SETTINGS,
      ...(engineIsTwoPlayer !== undefined ? { isTwoPlayer: engineIsTwoPlayer } : {}),
      ...(enginePrimaryChar !== undefined ? { primaryCharacter: enginePrimaryChar } : {}),
    };
  }

  public save(settings: GameSettingsState): boolean {
    try {
      this.effectiveStorage.setItem(SettingsStorage.SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      this.effectiveStorage.setItem(
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
      if (defaultGameEngine && merged.primaryCharacter) {
        defaultGameEngine.applySettings({ primaryCharacter: merged.primaryCharacter });
      }
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
    } catch (err) {
      this.logger.error(
        "Failed to read settings file content:",
        { fileName: file.name, fileSize: file.size, fileType: file.type },
        err
      );
      return null;
    }
  }

  private mergeWithDefaults(parsed: unknown): GameSettingsState {
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_SETTINGS;
    }
    const data = parsed as Record<string, unknown>;
    const display = (data.display && typeof data.display === "object" ? data.display : {}) as Partial<DisplaySettings>;
    const rawHud = data.hud && typeof data.hud === "object" ? (data.hud as unknown as Record<string, unknown>) : {};
    const p1Quick = rawHud.p1QuickKeys && typeof rawHud.p1QuickKeys === "object" ? (rawHud.p1QuickKeys as Partial<HudQuickKeysSettings>) : {};
    const p2Quick = rawHud.p2QuickKeys && typeof rawHud.p2QuickKeys === "object" ? (rawHud.p2QuickKeys as Partial<HudQuickKeysSettings>) : {};

    const hud: Partial<HudSettings> = {
      ...(rawHud as Partial<HudSettings>),
      p1QuickKeys: {
        ...DEFAULT_SETTINGS.hud.p1QuickKeys,
        ...p1Quick,
      },
      p2QuickKeys: {
        ...DEFAULT_SETTINGS.hud.p2QuickKeys,
        ...p2Quick,
      },
    };

    const primaryCharacter: "valen" | "aurelia" =
      data.primaryCharacter === "aurelia" ? "aurelia" : "valen";

    return {
      ...DEFAULT_SETTINGS,
      ...(data as Partial<GameSettingsState>),
      primaryCharacter,
      display: { ...DEFAULT_SETTINGS.display, ...display },
      hud: {
        ...DEFAULT_SETTINGS.hud,
        ...hud,
      },
    };
  }
}

export const defaultSettingsStorage: ISettingsStorage = new SettingsStorage();
