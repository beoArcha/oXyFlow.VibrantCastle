import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { SaveGameProvider, useSaveGame } from "../SaveGameContext";
import { I18nProvider } from "../I18nContext";
import { gameSave } from "@game/logic/save";
import gameEngine from "@game/loop/engine";

describe("SaveGameContext & useSaveGame Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameSave.clearSave();
  });

  afterEach(async () => {
    gameSave.clearSave();
    await cleanupDom();
  });

  const createWrapper = (onStateApplied?: () => void) => {
    return function TestSaveGameWrapper({ children }: { children: React.ReactNode }) {
      return (
        <I18nProvider>
          <SaveGameProvider onStateApplied={onStateApplied}>{children}</SaveGameProvider>
        </I18nProvider>
      );
    };
  };

  it("initializes with null lastSavedState when storage is empty", async () => {
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(),
    });

    expect(result.current.lastSavedState).toBeNull();
    expect(result.current.saveNotification).toBe("");

    await unmount();
  });

  it("handles notifications with auto-clearing via showNotification", async () => {
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.showNotification("Custom Save Notice");
    });

    expect(result.current.saveNotification).toBe("Custom Save Notice");

    // Manually clear or set
    await act(async () => {
      result.current.setSaveNotification("");
    });
    expect(result.current.saveNotification).toBe("");

    await unmount();
  });

  it("compiles and saves state to localStorage via saveToLocalStorage", async () => {
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.saveToLocalStorage();
    });

    expect(result.current.lastSavedState).not.toBeNull();
    expect(result.current.saveNotification.length).toBeGreaterThan(0);

    const storedInStorage = gameSave.loadFromLocalStorage();
    expect(storedInStorage).not.toBeNull();
    expect(storedInStorage?.levelId).toBeDefined();

    await unmount();
  });

  it("returns false and shows notice when loading from empty storage", async () => {
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(),
    });

    let success = true;
    await act(async () => {
      success = result.current.loadFromLocalStorage();
    });

    expect(success).toBe(false);
    expect(result.current.saveNotification.length).toBeGreaterThan(0);

    await unmount();
  });

  it("loads and applies save state successfully from localStorage", async () => {
    let appliedCount = 0;
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(() => {
        appliedCount++;
      }),
    });

    // Save first
    await act(async () => {
      result.current.saveToLocalStorage();
    });

    // Load back
    let success = false;
    await act(async () => {
      success = result.current.loadFromLocalStorage();
    });

    expect(success).toBe(true);
    expect(appliedCount).toBe(1);
    expect(result.current.lastSavedState).not.toBeNull();

    await unmount();
  });

  it("clears save and resets level on resetToDefaults", async () => {
    let appliedCount = 0;
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(() => {
        appliedCount++;
      }),
    });

    // Save state first
    await act(async () => {
      result.current.saveToLocalStorage();
    });
    expect(gameSave.loadFromLocalStorage()).not.toBeNull();

    // Reset
    await act(async () => {
      result.current.resetToDefaults();
    });

    expect(result.current.lastSavedState).toBeNull();
    expect(gameSave.loadFromLocalStorage()).toBeNull();
    expect(appliedCount).toBe(1);

    await unmount();
  });

  it("exports save to JSON string and imports valid JSON", async () => {
    const { result, unmount } = await renderCustomHook(() => useSaveGame(), {
      wrapper: createWrapper(),
    });

    // Export initial
    const jsonStr = result.current.exportToJson();
    expect(typeof jsonStr).toBe("string");
    expect(jsonStr).toContain('"levelId"');

    // Import invalid JSON
    let ok = false;
    await act(async () => {
      ok = result.current.importFromJson("{ invalid json ");
    });
    expect(ok).toBe(false);

    // Import valid JSON
    await act(async () => {
      ok = result.current.importFromJson(jsonStr);
    });
    expect(ok).toBe(true);

    await unmount();
  });
});
