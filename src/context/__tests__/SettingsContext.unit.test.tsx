import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { SettingsProvider, useSettings } from "../SettingsContext";
import { SettingsStorage } from "../settings/settingsStorage";
import { DEFAULT_SETTINGS, GameSettingsState } from "../settingsTypes";
import { createMockStorageProvider, MockStorageProvider } from "@test-utils";
import gameEngine from "@game/loop/engine";

describe("SettingsContext & useSettings Hook", () => {
  let mockStorageProvider: MockStorageProvider;
  let testStorage: SettingsStorage;

  beforeEach(async () => {
    await cleanupDom();
    mockStorageProvider = createMockStorageProvider();
    testStorage = new SettingsStorage(mockStorageProvider);
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const createWrapper = (storage: SettingsStorage) => {
    return function TestSettingsWrapper({ children }: { children: React.ReactNode }) {
      return <SettingsProvider storage={storage}>{children}</SettingsProvider>;
    };
  };

  it("initializes with DEFAULT_SETTINGS when storage is empty", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.volumeMusic).toBe(DEFAULT_SETTINGS.volumeMusic);
    expect(result.current.volumeSFX).toBe(DEFAULT_SETTINGS.volumeSFX);
    expect(result.current.isTwoPlayer).toBe(false);
    expect(result.current.displaySettings.aspectRatio).toBe("16:10");

    await unmount();
  });

  it("initializes from pre-populated storage", async () => {
    const customSettings: GameSettingsState = {
      ...DEFAULT_SETTINGS,
      volumeMusic: 0.9,
      isTwoPlayer: true,
      display: {
        ...DEFAULT_SETTINGS.display,
        aspectRatio: "16:9",
        targetFps: 120,
      },
    };
    testStorage.save(customSettings);

    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    expect(result.current.volumeMusic).toBe(0.9);
    expect(result.current.isTwoPlayer).toBe(true);
    expect(result.current.displaySettings.aspectRatio).toBe("16:9");
    expect(result.current.displaySettings.targetFps).toBe(120);

    await unmount();
  });

  it("clamps volume values between 0 and 1 and persists to storage", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    await act(async () => {
      result.current.setVolumeMusic(1.5); // Should clamp to 1.0
      result.current.setVolumeSFX(-0.5); // Should clamp to 0.0
    });

    expect(result.current.volumeMusic).toBe(1.0);
    expect(result.current.volumeSFX).toBe(0.0);

    // Verify storage received clamped settings
    const stored = testStorage.load();
    expect(stored.volumeMusic).toBe(1.0);
    expect(stored.volumeSFX).toBe(0.0);

    await unmount();
  });

  it("updates display settings granularly and persists", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    await act(async () => {
      result.current.setDisplaySettings({
        aspectRatio: "16:9",
        scalingFilter: "smooth",
      });
    });

    expect(result.current.displaySettings.aspectRatio).toBe("16:9");
    expect(result.current.displaySettings.scalingFilter).toBe("smooth");
    expect(result.current.displaySettings.targetFps).toBe(60); // Retained

    const stored = testStorage.load();
    expect(stored.display.aspectRatio).toBe("16:9");
    expect(stored.display.scalingFilter).toBe("smooth");

    await unmount();
  });

  it("updates hud settings granularly and persists", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    await act(async () => {
      result.current.setHudSettings({
        hudScale: "large",
        showNarratorSubtitles: false,
      });
    });

    expect(result.current.hudSettings.hudScale).toBe("large");
    expect(result.current.hudSettings.showNarratorSubtitles).toBe(false);

    const stored = testStorage.load();
    expect(stored.hud.hudScale).toBe("large");
    expect(stored.hud.showNarratorSubtitles).toBe(false);

    await unmount();
  });

  it("updates settings via updateSettings and toggles two-player mode", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    await act(async () => {
      result.current.setTwoPlayer(true);
    });

    expect(result.current.isTwoPlayer).toBe(true);
    expect(gameEngine.players.length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      result.current.updateSettings({ volumeMusic: 0.25 });
    });

    expect(result.current.volumeMusic).toBe(0.25);

    await unmount();
  });

  it("resets to DEFAULT_SETTINGS when resetToDefaults is invoked", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    await act(async () => {
      result.current.setVolumeMusic(0.1);
      result.current.setDisplaySettings({ aspectRatio: "4:3" });
    });

    expect(result.current.volumeMusic).toBe(0.1);
    expect(result.current.displaySettings.aspectRatio).toBe("4:3");

    await act(async () => {
      result.current.resetToDefaults();
    });

    expect(result.current.volumeMusic).toBe(DEFAULT_SETTINGS.volumeMusic);
    expect(result.current.displaySettings.aspectRatio).toBe(DEFAULT_SETTINGS.display.aspectRatio);

    const stored = testStorage.load();
    expect(stored).toEqual(DEFAULT_SETTINGS);

    await unmount();
  });

  it("imports and exports settings via JSON", async () => {
    const { result, unmount } = await renderCustomHook(() => useSettings(), {
      wrapper: createWrapper(testStorage),
    });

    const exportedJson = result.current.exportToJson();
    expect(typeof exportedJson).toBe("string");
    expect(exportedJson).toContain('"version"');

    const updatePayload = JSON.stringify({
      volumeMusic: 0.77,
      hud: { hudScale: "compact" },
    });

    let success = false;
    await act(async () => {
      success = result.current.importFromJson(updatePayload);
    });

    expect(success).toBe(true);
    expect(result.current.volumeMusic).toBe(0.77);
    expect(result.current.hudSettings.hudScale).toBe("compact");

    // Invalid JSON
    await act(async () => {
      success = result.current.importFromJson("INVALID");
    });
    expect(success).toBe(false);

    await unmount();
  });
});
