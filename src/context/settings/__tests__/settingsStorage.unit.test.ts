import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  SettingsStorage,
  ISettingsStorageProvider,
} from "../settingsStorage";
import { DEFAULT_SETTINGS, GameSettingsState } from "../settingsTypes";
import { createMockStorageProvider, MockStorageProvider } from "@test-utils";
import defaultGameEngine from "@game/loop/engine";

describe("SettingsStorage - Domain & Persistence", () => {
  let mockStorage: MockStorageProvider;
  let settingsStorage: SettingsStorage;

  beforeEach(() => {
    defaultGameEngine.setDefaultPrimaryCharacter("valen");
    defaultGameEngine.applySettings({ isTwoPlayer: false, primaryCharacter: "valen" });
    mockStorage = createMockStorageProvider();
    settingsStorage = new SettingsStorage(mockStorage);
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
      expect(loaded.display.aspectRatio).toBe("16:10");
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
      expect(loaded.display.hardwareAcceleration).toBe(false);
      // Defaults applied for other fields
      expect(loaded.language).toBe("pl");
      expect(loaded.primaryCharacter).toBe("valen");
      expect(loaded.volumeMusic).toBe(DEFAULT_SETTINGS.volumeMusic);
    });

    it("safely recovers with DEFAULT_SETTINGS when stored JSON is corrupted", () => {
      mockStorage.store[SettingsStorage.SETTINGS_STORAGE_KEY] = "{ corrupt_json: true, ";

      const loaded = settingsStorage.load();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
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

      const storageWithQuota = new SettingsStorage(failingStorage);
      const success = storageWithQuota.save(DEFAULT_SETTINGS);
      expect(success).toBe(false);
    });
  });

  describe("Export and Import Features", () => {
    it("exports settings to valid formatted JSON string", () => {
      const jsonStr = settingsStorage.exportToJson(DEFAULT_SETTINGS);
      expect(typeof jsonStr).toBe("string");
      const parsed = JSON.parse(jsonStr);
      expect(parsed.version).toBe(DEFAULT_SETTINGS.version);
      expect(parsed.primaryCharacter).toBe("valen");
      expect(parsed.display.aspectRatio).toBe(DEFAULT_SETTINGS.display.aspectRatio);
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
      const resultNum = settingsStorage.importFromJson("42");
      expect(resultNum).toBeNull();

      const resultBool = settingsStorage.importFromJson("true");
      expect(resultBool).toBeNull();
    });

    it("handles headless exportToFile without crashing", () => {
      expect(() => settingsStorage.exportToFile(DEFAULT_SETTINGS)).not.toThrow();
    });
  });
});
