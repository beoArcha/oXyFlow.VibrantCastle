import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  SettingsStorage,
  ISettingsStorageProvider,
} from "../settingsStorage";
import { DEFAULT_SETTINGS, GameSettingsState } from "../settingsTypes";
import { createMockStorageProvider, MockStorageProvider } from "@test-utils";
import defaultGameEngine from "@game/loop/engine";
import type { ILogger } from "@lib/logger";

function createSilentLogger(): ILogger {
  const noop = () => { };
  return { debug: noop, info: noop, warn: noop, error: noop } as unknown as ILogger;
}

describe("SettingsStorage - Domain & Persistence", () => {
  let mockStorage: MockStorageProvider;
  let settingsStorage: SettingsStorage;

  beforeEach(() => {
    defaultGameEngine.setDefaultPrimaryCharacter("valen");
    defaultGameEngine.applySettings({ isTwoPlayer: false, primaryCharacter: "valen" });
    mockStorage = createMockStorageProvider();
    settingsStorage = new SettingsStorage(mockStorage, createSilentLogger());
  });

  afterEach(() => {
    defaultGameEngine.setDefaultPrimaryCharacter("valen");
    defaultGameEngine.applySettings({ isTwoPlayer: false, primaryCharacter: "valen" });
  });

  describe("Settings Loading & Fallbacks", () => {
    it("returns DEFAULT_SETTINGS when storage is completely empty", () => {
      const loaded = settingsStorage.load();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
      expect(loaded.language).toBe("pl");
      expect(loaded.primaryCharacter).toBe("valen");
      expect(loaded.display.aspectRatio).toBe("auto");
      expect(loaded.hud.p1ThemeColor).toBe("crimson");
    });

    it("parses valid stored settings and merges with defaults", () => {
      const customSettings: Partial<GameSettingsState> = {
        language: "en",
        volumeMusic: 0.8,
        primaryCharacter: "aurelia",
        display: {
          aspectRatio: "16:9",
          scalingFilter: "smooth",
          assetQuality: "high",
          targetFps: 120,
          showFpsCounter: true,
          hardwareAcceleration: true,
        },
      };

      mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY] = JSON.stringify(customSettings);

      const loaded = settingsStorage.load();
      expect(loaded.language).toBe("en");
      expect(loaded.volumeMusic).toBe(0.8);
      expect(loaded.primaryCharacter).toBe("aurelia");
      expect(loaded.display.targetFps).toBe(120);
      expect(loaded.display.aspectRatio).toBe("16:9");
      // Default hud preserved
      expect(loaded.hud.p1CharacterName).toBe("Valen");
    });

    it("migrates legacy display settings if full settings key is absent", () => {
      const legacyDisplay = {
        aspectRatio: "4:3",
        scalingFilter: "pixel",
        assetQuality: "high",
        targetFps: 30,
        showFpsCounter: true,
        hardwareAcceleration: false,
      };

      mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY] = JSON.stringify(legacyDisplay);

      const loaded = settingsStorage.load();
      expect(loaded.display.aspectRatio).toBe("4:3");
      expect(loaded.display.targetFps).toBe(30);
      expect(loaded.display.showFpsCounter).toBe(true);
      expect(loaded.display.hardwareAcceleration).toBe(false);
      // Defaults applied for other fields
      expect(loaded.language).toBe("pl");
      expect(loaded.primaryCharacter).toBe("valen");
      expect(loaded.volumeMusic).toBe(DEFAULT_SETTINGS.volumeMusic);
    });

    it("fills legacy display gaps with defaults (aspectRatio auto, hardwareAcceleration true)", () => {
      mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY] = JSON.stringify({
        assetQuality: "low",
      });

      const loaded = settingsStorage.load();
      expect(loaded.display.assetQuality).toBe("low");
      expect(loaded.display.aspectRatio).toBe("auto");
      expect(loaded.display.scalingFilter).toBe("pixel");
      expect(loaded.display.targetFps).toBe(60);
      expect(loaded.display.hardwareAcceleration).toBe(true);
    });

    it("ignores legacy display settings when the full settings key is present", () => {
      mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY] = JSON.stringify({
        display: { aspectRatio: "16:9" },
      });
      mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY] = JSON.stringify({
        aspectRatio: "4:3",
        assetQuality: "low",
      });

      const loaded = settingsStorage.load();
      expect(loaded.display.aspectRatio).toBe("16:9");
      expect(loaded.display.assetQuality).toBe(DEFAULT_SETTINGS.display.assetQuality);
    });

    it("safely recovers with DEFAULT_SETTINGS when stored JSON is corrupted", () => {
      mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY] = "{ corrupt_json: true, ";

      const loaded = settingsStorage.load();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });

    it("falls back to DEFAULT_SETTINGS when the legacy display JSON is corrupted", () => {
      mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY] = "not-json{";

      const loaded = settingsStorage.load();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });

    it("tolerates unknown stale keys from older versions without throwing", () => {
      mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY] = JSON.stringify({
        version: 1,
        language: "en",
        primaryCharacter: "aurelia",
        hud: {
          showCreationTab: true,
          hudScale: "compact",
          p1ThemeColor: "cyan",
        },
        display: {
          aspectRatio: "4:3",
          removedField: 42,
        },
        someRemovedSetting: { nested: true },
      });

      let loaded: GameSettingsState | undefined;
      expect(() => {
        loaded = settingsStorage.load();
      }).not.toThrow();
      expect(loaded?.language).toBe("en");
      expect(loaded?.primaryCharacter).toBe("aurelia");
      expect(loaded?.hud.p1ThemeColor).toBe("cyan");
      expect(loaded?.display.aspectRatio).toBe("4:3");
      // Known fields still get defaults when absent
      expect(loaded?.hud.p1CharacterName).toBe("Valen");
      expect(loaded?.display.scalingFilter).toBe("pixel");
    });
  });

  describe("Settings Saving & Persistence", () => {
    it("persists settings to both full settings and legacy display storage keys", () => {
      const custom: GameSettingsState = {
        ...DEFAULT_SETTINGS,
        language: "en",
        volumeMusic: 0.3,
        primaryCharacter: "aurelia",
      };

      const success = settingsStorage.save(custom);
      expect(success).toBe(true);

      expect(mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY]).toBeDefined();
      const parsedFull = JSON.parse(mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY]);
      expect(parsedFull.language).toBe("en");
      expect(parsedFull.volumeMusic).toBe(0.3);
      expect(parsedFull.primaryCharacter).toBe("aurelia");

      expect(mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY]).toBeDefined();
      const parsedLegacy = JSON.parse(mockStorage.store[SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY]);
      expect(parsedLegacy.aspectRatio).toBe(DEFAULT_SETTINGS.display.aspectRatio);
    });

    it("gracefully catches storage quota exceptions and returns false", () => {
      const failingStorage: ISettingsStorageProvider = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      };

      const storageWithQuota = new SettingsStorage(failingStorage, createSilentLogger());
      expect(() => storageWithQuota.save(DEFAULT_SETTINGS)).not.toThrow();
      expect(storageWithQuota.save(DEFAULT_SETTINGS)).toBe(false);
    });

    it("returns false when only the legacy display write fails", () => {
      const store: Record<string, string> = {};
      const partiallyFailing: ISettingsStorageProvider = {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => {
          if (key === SettingsStorage.LEGACY_DISPLAY_STORAGE_KEY) {
            throw new Error("QuotaExceededError");
          }
          store[key] = value;
        },
      };

      const storage = new SettingsStorage(partiallyFailing, createSilentLogger());
      expect(storage.save(DEFAULT_SETTINGS)).toBe(false);
    });

    it("importFromJson still returns merged settings when persisting fails", () => {
      const failingStorage: ISettingsStorageProvider = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      };

      const storage = new SettingsStorage(failingStorage, createSilentLogger());
      const result = storage.importFromJson(JSON.stringify({ volumeSFX: 0.25 }));
      expect(result).not.toBeNull();
      expect(result?.volumeSFX).toBe(0.25);
    });
  });

  describe("Export and Import Features", () => {
    it("exports settings to valid formatted JSON string", () => {
      const jsonStr = settingsStorage.exportToJson(DEFAULT_SETTINGS);
      expect(typeof jsonStr).toBe("string");
      const parsed = JSON.parse(jsonStr);
      expect(parsed.primaryCharacter).toBe("valen");
      expect(parsed.display.aspectRatio).toBe(DEFAULT_SETTINGS.display.aspectRatio);
      expect(jsonStr).toContain("\n"); // pretty-printed
    });

    it("round-trips exported settings through import without loss", () => {
      const custom: GameSettingsState = {
        ...DEFAULT_SETTINGS,
        language: "en",
        volumeMusic: 0.11,
        volumeSFX: 0.22,
        isTwoPlayer: true,
        primaryCharacter: "aurelia",
        display: {
          ...DEFAULT_SETTINGS.display,
          aspectRatio: "16:9",
          targetFps: 120,
          showFpsCounter: true,
        },
        hud: {
          ...DEFAULT_SETTINGS.hud,
          p2ThemeColor: "crimson",
          p1QuickKeys: { primarySpell: "Q", secondarySpell: "W", potionsRange: "4-6" },
        },
      };

      const exported = settingsStorage.exportToJson(custom);
      const imported = settingsStorage.importFromJson(exported);

      expect(imported).toEqual(custom);
      expect(settingsStorage.load()).toEqual(custom);
    });

    it("imports settings from valid JSON, deep merges, persists, and synchronizes engine default", () => {
      expect(defaultGameEngine.defaultPrimaryCharacter).toBe("valen");

      const importedJson = JSON.stringify({
        volumeSFX: 0.95,
        primaryCharacter: "aurelia",
        hud: {
          p1ThemeColor: "cyan",
        },
      });

      const result = settingsStorage.importFromJson(importedJson);
      expect(result).not.toBeNull();
      expect(result?.volumeSFX).toBe(0.95);
      expect(result?.primaryCharacter).toBe("aurelia");
      expect(result?.hud.p1ThemeColor).toBe("cyan");
      expect(result?.language).toBe("pl"); // Preserved from defaults

      // Verifies it persisted into storage
      const inStore = JSON.parse(mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY]);
      expect(inStore.volumeSFX).toBe(0.95);
      expect(inStore.primaryCharacter).toBe("aurelia");

      // Verifies engine primary character was synchronized
      expect(defaultGameEngine.defaultPrimaryCharacter).toBe("aurelia");
    });

    it("returns null when importing invalid JSON without throwing", () => {
      const result = settingsStorage.importFromJson("INVALID_MALFORMED_JSON");
      expect(result).toBeNull();
    });

    it("returns null when importing non-object JSON values (number, boolean)", () => {
      expect(settingsStorage.importFromJson("42")).toBeNull();
      expect(settingsStorage.importFromJson("true")).toBeNull();
    });

    it("handles headless exportToFile without crashing", () => {
      expect(() => settingsStorage.exportToFile(DEFAULT_SETTINGS)).not.toThrow();
    });
  });
});
